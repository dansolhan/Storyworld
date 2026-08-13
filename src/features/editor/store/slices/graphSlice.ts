import type { StateCreator } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { DeletedPage, EditorState } from '../editorTypes';
import { updateGraphVisibility } from '../../utils/visibility';
import { autoLayoutGraph } from '../../utils/layout';

export const createGraphSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange' | 'onConnect' | 'setNodes' | 'setEdges' | 'loadStory' | 'organizeGraph'>> = (set, get) => ({
  nodes: [],
  edges: [],

  /**
   * React Flow's node changes, with removals routed through `deletePage`.
   *
   * Applying a `remove` change to `nodes` alone was how a deleted page became an
   * orphan: the node vanished from the canvas while the page record, its edges and
   * every choice pointing at it survived — invisible, unreachable, and still emitted
   * by the compiler. `deletePage` clears all four.
   *
   * Synthetic nodes are not removable: a crossing card and an action marker are
   * derived from a choice, so deleting one would only have it reappear on the next
   * sync. The choice is the thing to edit.
   */
  onNodesChange: (changes) => {
    const removals = changes.filter((change) => change.type === 'remove');
    const rest = changes.filter((change) => change.type !== 'remove');

    if (rest.length > 0) {
      set({ nodes: applyNodeChanges(rest, get().nodes) as EditorState['nodes'] });
    }

    const deleted: DeletedPage[] = [];
    for (const removal of removals) {
      const node = get().nodes.find((candidate) => candidate.id === removal.id);
      if (node?.type !== 'pageNode') continue;
      const removed = get().deletePage(removal.id);
      if (removed) deleted.push(removed);
    }

    return deleted;
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    // Determine source page, choice, and target page and push through our custom action
    // so that nodes and edges stay perfectly locked in sync
    const sourcePageId = connection.source;
    const choiceId = connection.sourceHandle;
    const targetPageId = connection.target;

    if (sourcePageId && choiceId && targetPageId) {
      // `get()` is typed as the whole EditorState, not just this slice, so the
      // coordinator's other slices are reachable from here.
      get().setChoiceDestination(sourcePageId, choiceId, targetPageId);
    } else {
      // Fallback
      set({
        edges: addEdge(connection, get().edges),
      });
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  organizeGraph: () => set((state) => ({
    nodes: autoLayoutGraph(state.nodes, state.edges)
  })),

  loadStory: ({ nodes, edges, pages, variables, items, metadata, subplots, audio, atmospheres, statusData, contextualText, derivedTexts }) => set((state) => {
    const visibleGraph = updateGraphVisibility(nodes, edges, null);
    return {
      nodes: visibleGraph.nodes,
      edges: visibleGraph.edges,
      pages,
      currentPlotId: null, // Reset to root safely
      variables: variables || {},
      items: items || {},
      storyTitle: metadata?.title || 'Untitled Story',
      storyTitleLocId: metadata?.titleLocId || state.storyTitleLocId,
      storyDescription: metadata?.description || '',
      storyDescriptionLocId: metadata?.descriptionLocId || state.storyDescriptionLocId,
      startPageId: metadata?.startPageId || undefined,
      subplots: subplots || [],
      audio: audio || {},
      atmospheres: atmospheres || {},
      statusData: statusData || [],
      contextualText: contextualText || {},
      derivedTexts: derivedTexts || {},
    };
  }),
});
