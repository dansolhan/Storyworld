import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { Choice } from '../../../../domain/Choice/Choice';

export const createChoiceSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addChoice' | 'updateChoiceText'>> = (set, get) => ({
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
  }
});
