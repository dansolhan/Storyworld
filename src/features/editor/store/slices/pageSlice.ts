import type { StateCreator } from 'zustand';
import type { EditorState, EditorNode } from '../editorTypes';
import type { Page } from '../../../../domain/Page/Page';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';

export const createPageSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'pages' | 'setPages' | 'addPage' | 'updatePageTitle' | 'updatePageType' | 'updatePageAtmosphere' | 'deletePage'>> = (set, get) => ({
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
        titleLocId: crypto.randomUUID(),
        paragraphs: [],
        choices: [],
        ...(currentPlotId ? { subplotId: currentPlotId } : {}),
        ...(atmosphereId ? { atmosphereId } : {})
      }
    };

    const newPage: Page = {
      id: newId,
      title: 'New Page',
      titleLocId: crypto.randomUUID(),
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

  /**
   * Assigning a page's atmosphere. This lived as a raw `setState` with a cast
   * inside the sidebar component; syncSyntheticNodes already copies
   * `atmosphereId` from the domain page onto the node, so the page is the only
   * thing that needs writing.
   */
  updatePageAtmosphere: (pageId, atmosphereId) => {
    set((state) => {
      const nextPages = {
        ...state.pages,
        [pageId]: { ...state.pages[pageId], atmosphereId }
      };
      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  },

  /**
   * Removes a page and everything that pointed at it.
   *
   * React Flow's own delete only removes the *node*, leaving `pages[id]` behind
   * as an orphan the compiler would still emit. This clears all four places a
   * page exists: the node, the page record, the edges touching it, and any
   * choice still naming it as a destination.
   */
  deletePage: (pageId) => {
    set((state) => {
      if (!state.pages[pageId]) return state;

      const nextPages: Record<string, Page> = {};
      for (const [id, page] of Object.entries(state.pages)) {
        if (id === pageId) continue;
        const choices = (page.choices || []).map((choice) =>
          choice.targetPageId === pageId ? { ...choice, targetPageId: undefined } : choice
        );
        nextPages[id] = choices.some((choice, index) => choice !== page.choices[index])
          ? { ...page, choices }
          : page;
      }

      const nodes = state.nodes.filter((node) => node.id !== pageId);
      const edges = state.edges.filter((edge) => edge.source !== pageId && edge.target !== pageId);

      const synced = syncSyntheticNodes(nodes, edges, nextPages, state.subplots || [], state.currentPlotId);
      return {
        pages: nextPages,
        nodes: synced.nodes,
        edges: synced.edges,
        // A deleted page cannot stay selected, or the inspector reads a hole.
        selectedPageId: state.selectedPageId === pageId ? null : state.selectedPageId,
        startPageId: state.startPageId === pageId ? null : state.startPageId,
      };
    });
  },
});
