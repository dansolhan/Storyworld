import type { StateCreator } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { EditorState } from '../editorTypes';
import { updateGraphVisibility } from '../../utils/visibility';
import { autoLayoutGraph } from '../../utils/layout';

export const createGraphSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange' | 'onConnect' | 'setNodes' | 'setEdges' | 'loadStory' | 'organizeGraph'>> = (set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as EditorState['nodes'],
    });
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

  loadStory: ({ nodes, edges, pages, variables, items, metadata, subplots, audio, atmospheres, statusData }) => set((state) => {
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
    };
  }),
});
