import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { Paragraph } from '../../../../domain/Paragraph/Paragraph';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';

export const createParagraphSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addParagraph' | 'updateParagraph'>> = (set) => ({
  addParagraph: (pageId) => {
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const newParagraph: Paragraph = { id: `p-${Date.now()}`, text: 'New content here...', conditionals: [] };
      const nextPages = {
        ...state.pages,
        [pageId]: {
          ...page,
          paragraphs: [...(page.paragraphs || []), newParagraph],
        },
      };

      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  },

  updateParagraph: (pageId, paragraphId, newText) => {
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const nextPages = {
        ...state.pages,
        [pageId]: {
          ...page,
          paragraphs: (page.paragraphs || []).map((p: Paragraph) =>
            p.id === paragraphId ? { ...p, text: newText } : p
          ),
        },
      };

      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  },
});
