import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { Paragraph } from '../../../../domain/Paragraph/Paragraph';

export const createParagraphSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addParagraph' | 'updateParagraph'>> = (set, get) => ({
  addParagraph: (pageId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId) {
          const newParagraph = { id: `p-${Date.now()}`, text: 'New content here...' };
          return {
            ...node,
            data: {
              ...node.data,
              paragraphs: [...(node.data.paragraphs || []), newParagraph],
            },
          };
        }
        return node;
      }),
    });
  },

  updateParagraph: (pageId, paragraphId, newText) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.data.paragraphs) {
          return {
            ...node,
            data: {
              ...node.data,
              paragraphs: node.data.paragraphs.map((p: Paragraph) =>
                p.id === paragraphId ? { ...p, text: newText } : p
              ),
            },
          };
        }
        return node;
      }),
    });
  },
});
