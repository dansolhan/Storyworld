import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { Choice } from '../../../../domain/Choice/Choice';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
export const createChoiceSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | 'addChoice'
    | 'updateChoiceText'
    | 'addChoiceConditional'
    | 'updateChoiceConditional'
    | 'removeChoiceConditional'
    | 'updateChoiceConditionalLogic'
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

  addChoiceConditional: (pageId, choiceId, blueprintId) => {
    const blueprint = conditionalBlueprints[blueprintId];
    if (!blueprint) return;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: Choice) => {
                if (c.id === choiceId) {
                  const newConditional = {
                    id: `cond-${Date.now()}`,
                    blueprintId,
                    params: JSON.parse(JSON.stringify(blueprint.defaultParams)), // deep copy defaults
                  };
                  return {
                    ...c,
                    conditionals: [...(c.conditionals || []), newConditional],
                    conditionalLogic: c.conditionalLogic || 'AND',
                  };
                }
                return c;
              }),
            },
          };
        }
        return node;
      })
    });
  },

  updateChoiceConditional: (pageId, choiceId, conditionalId, params) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: Choice) => {
                if (c.id === choiceId && c.conditionals) {
                  return {
                    ...c,
                    conditionals: c.conditionals.map((cond) =>
                      cond.id === conditionalId ? { ...cond, params } : cond
                    ),
                  };
                }
                return c;
              }),
            },
          };
        }
        return node;
      })
    });
  },

  removeChoiceConditional: (pageId, choiceId, conditionalId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: Choice) => {
                if (c.id === choiceId && c.conditionals) {
                  return {
                    ...c,
                    conditionals: c.conditionals.filter((cond) => cond.id !== conditionalId),
                  };
                }
                return c;
              }),
            },
          };
        }
        return node;
      })
    });
  },

  updateChoiceConditionalLogic: (pageId, choiceId, logic) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map((c: Choice) => {
                if (c.id === choiceId) {
                  return {
                    ...c,
                    conditionalLogic: logic,
                  };
                }
                return c;
              }),
            },
          };
        }
        return node;
      })
    });
  }
});
