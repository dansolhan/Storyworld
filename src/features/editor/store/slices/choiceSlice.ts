import type { StateCreator } from 'zustand';
import { MarkerType } from '@xyflow/react';
import type { EditorState } from '../editorTypes';
import type { Choice } from '../../../../domain/Choice/Choice';
export const createChoiceSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | 'addChoice'
    | 'updateChoiceText'
    | 'setChoiceDestination'
    | 'createPageFromChoice'
  >
> = (set, get) => ({
  addChoice: (pageId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId) {
          const newChoice = { id: `c-${Date.now()}`, text: 'New Choice...', targetPageId: '' };
          return {
            ...node,
            data: {
              ...node.data,
              choices: [...(node.data.choices || []), newChoice],
            },
          };
        }
        return node;
      }),
    });
  },

  updateChoiceText: (pageId, choiceId, newText) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.data.choices) {
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
      }),
    });
  },

  setChoiceDestination: (sourcePageId: string, choiceId: string, targetPageId: string) => {
    const { nodes, edges } = get();

    // 1. Update the choice's targetPageId in the nodes array
    const newNodes = nodes.map((node) => {
      if (node.id === sourcePageId && node.data.choices) {
        return {
          ...node,
          data: {
            ...node.data,
            choices: node.data.choices.map((c: Choice) =>
              c.id === choiceId ? { ...c, targetPageId } : c
            ),
          },
        };
      }
      return node;
    });

    // 2. Synchronize the edges: remove any old edge from this choice, and add the new one
    const filteredEdges = edges.filter(
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

    set({ nodes: newNodes, edges: newEdges });
  },

  createPageFromChoice: (sourcePageId: string, choiceId: string) => {
    const { nodes, addPage, setChoiceDestination } = get();
    const sourceNode = nodes.find((n) => n.id === sourcePageId);

    if (sourceNode) {
      // Offset the new page to the right
      const x = sourceNode.position.x + 400;
      const y = sourceNode.position.y;

      const newPageId = addPage(x, y);
      setChoiceDestination(sourcePageId, choiceId, newPageId);
    }
  }
});
