import type { StateCreator } from 'zustand';
import type { EditorState, EditorNode } from '../editorTypes';

export const createPageSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addPage' | 'updatePageTitle'>> = (set, get) => ({
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
});
