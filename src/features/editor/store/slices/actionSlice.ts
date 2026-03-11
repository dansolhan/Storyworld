import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import type { Action } from '../../../../domain/Actions/Action';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';

export const createActionSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'addAction' | 'updateAction' | 'removeAction'>
> = (set) => ({
  addAction: (targetType, pageId, targetId, blueprintId) =>
    set((state) => {
      const blueprint = actionBlueprints[blueprintId];
      if (!blueprint) return state;

      const newAction = {
        id: crypto.randomUUID(),
        blueprintId,
        params: Object.assign({}, blueprint.defaultParams) as Record<string, unknown>,
        conditionals: [],
      };

      const newNodes = state.nodes.map((node) => {
        if (node.id !== pageId || node.type !== 'pageNode') return node;

        if (targetType === 'page') {
          return {
            ...node,
            data: {
              ...node.data,
              actions: [...(node.data.actions || []), newAction],
            },
          };
        } else if (targetType === 'choice') {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: any) =>
                c.id === targetId
                  ? { ...c, actions: [...(c.actions || []), newAction] }
                  : c
              ),
            },
          };
        }
        return node;
      });

      const synced = syncSyntheticNodes(newNodes, state.edges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    }),

  updateAction: (targetType, pageId, targetId, actionId, params) =>
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id !== pageId || node.type !== 'pageNode') return node;

        if (targetType === 'page') {
          return {
            ...node,
            data: {
              ...node.data,
              actions: node.data.actions?.map((act) =>
                act.id === actionId ? { ...act, params } : act
              ) || [],
            },
          };
        } else if (targetType === 'choice') {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: any) =>
                c.id === targetId
                  ? {
                    ...c,
                    actions: (c.actions as Action[] | undefined)?.map((act: Action) =>
                      act.id === actionId ? { ...act, params } : act
                    ) || [],
                  }
                  : c
              ),
            },
          };
        }
        return node;
      });

      const synced = syncSyntheticNodes(newNodes, state.edges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    }),

  removeAction: (targetType, pageId, targetId, actionId) =>
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id !== pageId || node.type !== 'pageNode') return node;

        if (targetType === 'page') {
          return {
            ...node,
            data: {
              ...node.data,
              actions: node.data.actions?.filter((a) => a.id !== actionId) || [],
            },
          };
        } else if (targetType === 'choice') {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: any) =>
                c.id === targetId
                  ? {
                    ...c,
                    actions: (c.actions as Action[] | undefined)?.filter((a: Action) => a.id !== actionId) || [],
                  }
                  : c
              ),
            },
          };
        }
        return node;
      });

      const synced = syncSyntheticNodes(newNodes, state.edges, state.subplots || [], state.currentPlotId);
      return { nodes: synced.nodes, edges: synced.edges };
    }),
});
