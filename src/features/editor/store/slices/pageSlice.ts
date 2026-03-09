import type { StateCreator } from 'zustand';
import type { EditorState, EditorNode } from '../editorTypes';

export const createPageSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addPage' | 'updatePageTitle' | 'updatePageType'>> = (set, get) => ({
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

    set({ nodes: [...get().nodes, newNode] });
    return newId;
  },

  updatePageTitle: (pageId, newTitle) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.type === 'pageNode') {
          return { ...node, data: { ...node.data, title: newTitle } };
        }
        return node;
      }),
    });
  },

  updatePageType: (pageId, newType) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === pageId && node.type === 'pageNode') {
          return { ...node, data: { ...node.data, type: newType } };
        }
        return node;
      }),
    });
  },
});
