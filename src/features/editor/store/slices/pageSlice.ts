import type { StateCreator } from 'zustand';
import type { EditorState, EditorNode } from '../editorTypes';
import type { Page } from '../../../../domain/Page/Page';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';

export const createPageSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'pages' | 'setPages' | 'addPage' | 'updatePageTitle' | 'updatePageType'>> = (set, get) => ({
  pages: {},
  setPages: (pages) => set({ pages }),
  addPage: (x, y, atmosphereId) => {
    const newId = `page-${crypto.randomUUID()}`;
    const currentPlotId = get().currentPlotId; // Fetch the active plot id

    const newNode: EditorNode = {
      id: newId,
      type: 'pageNode',
      position: { x, y },
      data: {
        type: 'location',
        title: 'New Page',
        paragraphs: [],
        choices: [],
        ...(currentPlotId ? { subplotId: currentPlotId } : {}),
        ...(atmosphereId ? { atmosphereId } : {})
      }
    };

    const newPage: Page = {
      id: newId,
      title: 'New Page',
      paragraphs: [],
      choices: [],
      events: [],
      ...(currentPlotId ? { subplotId: currentPlotId } : {}),
      ...(atmosphereId ? { atmosphereId } : {})
    };

    set({
      nodes: [...get().nodes, newNode],
      pages: { ...get().pages, [newId]: newPage }
    });
    return newId;
  },

  updatePageTitle: (pageId, newTitle) => {
    set((state) => {
      const nextPages = {
        ...state.pages,
        [pageId]: { ...state.pages[pageId], title: newTitle }
      };
      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  },

  updatePageType: (pageId, newType) => {
    set((state) => {
      const nextPages = {
        ...state.pages,
        [pageId]: { ...state.pages[pageId], type: newType }
      };
      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  },
});
