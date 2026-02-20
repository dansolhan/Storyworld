import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import type { PageNodeType } from '../nodes/PageNode';

type EditorNode = PageNodeType;

interface EditorState {
  nodes: EditorNode[];
  edges: Edge[];

  // React Flow Handlers
  onNodesChange: OnNodesChange<EditorNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: EditorNode[]) => void;
  setEdges: (edges: Edge[]) => void;

  // Domain Handlers
  loadStory: (nodes: EditorNode[], edges: Edge[]) => void;
  addPage: (x: number, y: number) => string;
  updatePageTitle: (pageId: string, newTitle: string) => void;
  addParagraph: (pageId: string) => void;
  updateParagraph: (pageId: string, paragraphId: string, newText: string) => void;
  addChoice: (pageId: string) => void;
  updateChoiceText: (pageId: string, choiceId: string, newText: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as EditorNode[],
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

  loadStory: (nodes, edges) => set({ nodes, edges }),

  addPage: (x, y) => {
    const newId = `page-${Date.now()}`;
    const newNode: EditorNode = {
      id: newId,
      type: 'pageNode',
      position: { x, y },
      data: {
        title: 'New Page',
        paragraphs: [],
        choices: [],
      }
    };

    set({ nodes: [...get().nodes, newNode] });
    return newId;
  },

  updatePageTitle: (pageId, newTitle) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId) {
          return { ...node, data: { ...node.data, title: newTitle } };
        }
        return node;
      }),
    });
  },

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
              paragraphs: node.data.paragraphs.map(p =>
                p.id === paragraphId ? { ...p, text: newText } : p
              ),
            },
          };
        }
        return node;
      }),
    });
  },

  addChoice: (pageId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId) {
          const newChoice = { id: `c-${Date.now()}`, text: 'New Choice...', targetPageId: '' };
          return {
            ...node,
            data: {
              ...node.data,
              choices: [...(node.data.choices || []), newChoice],
            },
          };
        }
        return node;
      }),
    });
  },

  updateChoiceText: (pageId, choiceId, newText) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.data.choices) {
          return {
            ...node,
            data: {
              ...node.data,
              choices: node.data.choices.map(c =>
                c.id === choiceId ? { ...c, text: newText } : c
              ),
            },
          };
        }
        return node;
      }),
    });
  }
}));
