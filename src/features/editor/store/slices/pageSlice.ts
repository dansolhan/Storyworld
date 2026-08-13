import type { StateCreator } from 'zustand';
import type { EditorState, EditorNode } from '../editorTypes';
import type { Page } from '../../../../domain/Page/Page';
import type { DeletedPage } from '../editorTypes';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';

export const createPageSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'pages' | 'setPages' | 'addPage' | 'updatePageTitle' | 'updatePageType' | 'updatePageAtmosphere' | 'deletePage' | 'restoreDeletedPage'>> = (set, get) => ({
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
    /*
     * Captured before the write, so the caller can offer the page back. Deleting a
     * page destroys prose, and until this returned something there was no way to
     * undo it — the Delete key was a one-way door.
     */
    let deleted: DeletedPage | undefined;

    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      deleted = {
        page,
        node: state.nodes.find((node) => node.id === pageId),
        inbound: Object.values(state.pages).flatMap((candidate) =>
          (candidate.choices || [])
            .filter((choice) => choice.targetPageId === pageId)
            .map((choice) => ({ pageId: candidate.id, choiceId: choice.id }))
        ),
        wasStartPage: state.startPageId === pageId,
      };

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

    return deleted;
  },

  /**
   * Puts a deleted page back, with its position, its inbound choices and its role.
   *
   * Targeted rather than a wholesale state restore: an author who deletes a page,
   * edits something else, then reaches for Undo should get the page back and keep the
   * edit.
   */
  restoreDeletedPage: (deleted) => {
    set((state) => {
      const nextPages = { ...state.pages, [deleted.page.id]: deleted.page };

      for (const { pageId, choiceId } of deleted.inbound) {
        const owner = nextPages[pageId];
        if (!owner) continue;
        nextPages[pageId] = {
          ...owner,
          choices: (owner.choices || []).map((choice) =>
            choice.id === choiceId ? { ...choice, targetPageId: deleted.page.id } : choice
          ),
        };
      }

      const nodes = deleted.node && !state.nodes.some((node) => node.id === deleted.page.id)
        ? [...state.nodes, deleted.node]
        : state.nodes;

      /*
       * The edges are rebuilt from the choices rather than restored: `setChoiceDestination`
       * owns that mapping, and a stale edge would outlive whatever the author changed
       * in the meantime.
       */
      const edges = state.edges.filter((edge) => edge.target !== deleted.page.id);
      const restoredEdges = [
        ...edges,
        ...deleted.inbound.map(({ pageId, choiceId }) => ({
          id: `e-${pageId}-${choiceId}`,
          source: pageId,
          target: deleted.page.id,
          sourceHandle: choiceId,
          type: 'floating',
        })),
      ];

      const synced = syncSyntheticNodes(nodes, restoredEdges, nextPages, state.subplots || [], state.currentPlotId);
      return {
        pages: nextPages,
        nodes: synced.nodes,
        edges: synced.edges,
        startPageId: deleted.wasStartPage ? deleted.page.id : state.startPageId,
      };
    });
  },
});
