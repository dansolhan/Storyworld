import type { StateCreator } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { EditorState } from '../editorTypes';

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
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  loadStory: (nodes, edges, variables) => set(() => ({ nodes, edges, ...(variables ? { variables } : {}) })),
});
