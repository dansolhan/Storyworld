import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { Paragraph } from '../../../../domain/Paragraph/Paragraph';

export const createParagraphSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addParagraph' | 'updateParagraph'>> = (set) => ({
  addParagraph: (pageId) => {
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const newParagraph: Paragraph = { id: `p-${Date.now()}`, text: 'New content here...', conditionals: [] };
      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            paragraphs: [...(page.paragraphs || []), newParagraph],
          },
        },
      };
    });
  },

  updateParagraph: (pageId, paragraphId, newText) => {
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            paragraphs: (page.paragraphs || []).map((p: Paragraph) =>
              p.id === paragraphId ? { ...p, text: newText } : p
            ),
          },
        },
      };
    });
  },
});
