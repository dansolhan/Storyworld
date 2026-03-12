import type { StateCreator } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { EditorState } from '../editorTypes';
import { updateGraphVisibility } from '../../utils/visibility';

export const createGraphSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange' | 'onConnect' | 'setNodes' | 'setEdges' | 'loadStory'>> = (set, get) => ({
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
      // If we don't cast to any, TypeScript will yell since get() won't know about the
      // full EditorState in this partial slice context, but our central store has it.
      (get() as any).setChoiceDestination(sourcePageId, choiceId, targetPageId);
    } else {
      // Fallback
      set({
        edges: addEdge(connection, get().edges),
      });
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  loadStory: ({ nodes, edges, pages, variables, items, metadata, subplots, audio, atmospheres, statusData }) => set(() => {
    const visibleGraph = updateGraphVisibility(nodes, edges, null);
    return {
      nodes: visibleGraph.nodes,
      edges: visibleGraph.edges,
      pages,
      currentPlotId: null, // Reset to root safely
      variables: variables || {},
      items: items || {},
      storyTitle: metadata?.title || 'Untitled Story',
      storyDescription: metadata?.description || '',
      startPageId: metadata?.startPageId || undefined,
      subplots: subplots || [],
      audio: audio || {},
      atmospheres: atmospheres || {},
      statusData: statusData || [],
    };
  }),
});
