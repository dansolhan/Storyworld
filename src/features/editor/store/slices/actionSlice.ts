import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import { actionBlueprints } from '../../../../domain/Actions/registry';


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

      return {
        nodes: state.nodes.map((node) => {
          if (node.id !== pageId) return node;

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
                choices: node.data.choices.map((c) =>
                  c.id === targetId
                    ? { ...c, actions: [...(c.actions || []), newAction] }
                    : c
                ),
              },
            };
          }
          return node;
        }),
      };
    }),

  updateAction: (targetType, pageId, targetId, actionId, params) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== pageId) return node;

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
              choices: node.data.choices.map((c) =>
                c.id === targetId
                  ? {
                    ...c,
                    actions: c.actions?.map((act) =>
                      act.id === actionId ? { ...act, params } : act
                    ) || [],
                  }
                  : c
              ),
            },
          };
        }
        return node;
      }),
    })),

  removeAction: (targetType, pageId, targetId, actionId) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== pageId) return node;

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
              choices: node.data.choices.map((c) =>
                c.id === targetId
                  ? {
                    ...c,
                    actions: c.actions?.filter((a) => a.id !== actionId) || [],
                  }
                  : c
              ),
            },
          };
        }
        return node;
      }),
    })),
});
