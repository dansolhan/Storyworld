import type { StateCreator } from 'zustand';
import { MarkerType } from '@xyflow/react';
import type { EditorState } from '../editorTypes';
import type { Choice } from '../../../../domain/Choice/Choice';
import type { Action } from '../../../../domain/Actions/Action';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';

export const createChoiceSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | 'addChoice'
    | 'addActionOnlyChoice'
    | 'updateChoiceText'
    | 'setChoiceDestination'
    | 'setChoiceActions'
    | 'createPageFromChoice'
  >
> = (set, get) => ({
  addChoice: (pageId) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id === pageId && node.type === 'pageNode') {
          const newChoice: Choice = { id: `c-${Date.now()}`, text: 'New Choice...' };
          return {
            ...node,
            data: {
              ...node.data,
              choices: [...(node.data.choices || []), newChoice],
            },
          };
        }
        return node;
      });
      const synced = syncSyntheticNodes(newNodes, state.edges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    });
  },

  addActionOnlyChoice: (pageId) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id === pageId && node.type === 'pageNode') {
          // No targetPageId — this is an action-only choice
          const newChoice: Choice = { id: `c-${Date.now()}`, text: 'New Choice...', actions: [] };
          return {
            ...node,
            data: {
              ...node.data,
              choices: [...(node.data.choices || []), newChoice],
            },
          };
        }
        return node;
      });
      const synced = syncSyntheticNodes(newNodes, state.edges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    });
  },

  updateChoiceText: (pageId, choiceId, newText) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id === pageId && node.type === 'pageNode' && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: Choice) =>
                c.id === choiceId ? { ...c, text: newText } : c
              ),
            },
          };
        }
        return node;
      });
      const synced = syncSyntheticNodes(newNodes, state.edges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    });
  },

  setChoiceActions: (pageId: string, choiceId: string, actions: Action[]) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id === pageId && node.type === 'pageNode' && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: Choice) =>
                c.id === choiceId ? { ...c, actions } : c
              ),
            },
          };
        }
        return node;
      });
      const synced = syncSyntheticNodes(newNodes, state.edges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    });
  },

  setChoiceDestination: (sourcePageId: string, choiceId: string, targetPageId: string | undefined) => {
    set((state) => {
      // 1. Update the choice's targetPageId in the nodes array
      const newNodes = state.nodes.map((node) => {
        if (node.id === sourcePageId && node.type === 'pageNode' && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: Choice) =>
                c.id === choiceId ? { ...c, targetPageId: targetPageId || undefined } : c
              ),
            },
          };
        }
        return node;
      });

      // 2. Synchronize the edges: remove any old edge from this choice, and add the new one
      const filteredEdges = state.edges.filter(
        (e) => !(e.source === sourcePageId && e.sourceHandle === choiceId)
      );

      const newEdges = targetPageId ? [
        ...filteredEdges,
        {
          id: `e-${choiceId}-${targetPageId}`,
          source: sourcePageId,
          target: targetPageId,
          sourceHandle: choiceId,
          type: 'floating',
          animated: true,
          style: { stroke: 'var(--color-edge-default)' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--color-edge-default)'
          }
        },
      ] : filteredEdges;

      // 3. Since choice destination changes might toggle synthetic action nodes, rebuild them
      const synced = syncSyntheticNodes(newNodes, newEdges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    });
  },

  createPageFromChoice: (sourcePageId: string, choiceId: string) => {
    const { nodes, addPage, setChoiceDestination } = get();
    const sourceNode = nodes.find((n) => n.id === sourcePageId);

    if (sourceNode) {
      // Offset the new page to the right
      const x = sourceNode.position.x + 400;
      const y = sourceNode.position.y;
      const atmosphereId = sourceNode.type === 'pageNode' ? sourceNode.data.atmosphereId : undefined;

      const newPageId = addPage(x, y, atmosphereId);
      setChoiceDestination(sourcePageId, choiceId, newPageId);
    }
  }
});
