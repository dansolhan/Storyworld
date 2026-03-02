import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { Choice } from '../../../../domain/Choice/Choice';
import type { Paragraph } from '../../../../domain/Paragraph/Paragraph';
import type { Action } from '../../../../domain/Actions/Action';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { addConditionalToTree, updateConditionalInTree, removeConditionalFromTree } from '../utils/conditionalUtils';

export const createConditionalSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | 'addConditional'
    | 'updateConditional'
    | 'removeConditional'
  >
> = (set, get) => ({
  addConditional: (targetType, pageId, targetId, blueprintId, parentId) => {
    const blueprint = conditionalBlueprints[blueprintId];
    if (!blueprint) return;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId) {
          const newConditional = {
            id: `cond-${Date.now()}`,
            blueprintId,
            params: JSON.parse(JSON.stringify(blueprint.defaultParams)), // deep copy defaults
          };

          if (targetType === 'choice' && node.data.choices) {
            return {
              ...node,
              data: {
                ...node.data,
                choices: node.data.choices.map((c: Choice) => {
                  if (c.id === targetId) {
                    return {
                      ...c,
                      conditionals: addConditionalToTree(c.conditionals, parentId || null, newConditional),
                    };
                  }
                  return c;
                }),
              },
            };
          } else if (targetType === 'paragraph' && node.data.paragraphs) {
            return {
              ...node,
              data: {
                ...node.data,
                paragraphs: node.data.paragraphs.map((p: Paragraph) => {
                  if (p.id === targetId) {
                    return {
                      ...p,
                      conditionals: addConditionalToTree(p.conditionals, parentId || null, newConditional),
                    };
                  }
                  return p;
                }),
              },
            };
          } else if (targetType === 'action' && node.data.actions) {
            return {
              ...node,
              data: {
                ...node.data,
                actions: node.data.actions.map((a: Action) => {
                  if (a.id === targetId) {
                    return {
                      ...a,
                      conditionals: addConditionalToTree(a.conditionals, parentId || null, newConditional),
                    };
                  }
                  return a;
                }),
              },
            };
          }
        }
        return node;
      })
    });
  },

  updateConditional: (targetType, pageId, targetId, conditionalId, params) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId) {
          if (targetType === 'choice' && node.data.choices) {
            return {
              ...node,
              data: {
                ...node.data,
                choices: node.data.choices.map((c: Choice) => {
                  if (c.id === targetId && c.conditionals) {
                    return {
                      ...c,
                      conditionals: updateConditionalInTree(c.conditionals, conditionalId, params),
                    };
                  }
                  return c;
                }),
              },
            };
          } else if (targetType === 'paragraph' && node.data.paragraphs) {
            return {
              ...node,
              data: {
                ...node.data,
                paragraphs: node.data.paragraphs.map((p: Paragraph) => {
                  if (p.id === targetId && p.conditionals) {
                    return {
                      ...p,
                      conditionals: updateConditionalInTree(p.conditionals, conditionalId, params),
                    };
                  }
                  return p;
                }),
              },
            };
          } else if (targetType === 'action' && node.data.actions) {
            return {
              ...node,
              data: {
                ...node.data,
                actions: node.data.actions.map((a: Action) => {
                  if (a.id === targetId && a.conditionals) {
                    return {
                      ...a,
                      conditionals: updateConditionalInTree(a.conditionals, conditionalId, params),
                    };
                  }
                  return a;
                }),
              },
            };
          }
        }
        return node;
      })
    });
  },

  removeConditional: (targetType, pageId, targetId, conditionalId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId) {
          if (targetType === 'choice' && node.data.choices) {
            return {
              ...node,
              data: {
                ...node.data,
                choices: node.data.choices.map((c: Choice) => {
                  if (c.id === targetId && c.conditionals) {
                    return {
                      ...c,
                      conditionals: removeConditionalFromTree(c.conditionals, conditionalId),
                    };
                  }
                  return c;
                }),
              },
            };
          } else if (targetType === 'paragraph' && node.data.paragraphs) {
            return {
              ...node,
              data: {
                ...node.data,
                paragraphs: node.data.paragraphs.map((p: Paragraph) => {
                  if (p.id === targetId && p.conditionals) {
                    return {
                      ...p,
                      conditionals: removeConditionalFromTree(p.conditionals, conditionalId),
                    };
                  }
                  return p;
                }),
              },
            };
          }
        }
        return node;
      })
    });
  }
});
