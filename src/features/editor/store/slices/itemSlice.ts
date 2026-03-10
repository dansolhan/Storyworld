import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createItemSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'items' | 'setItems' | 'addItem' | 'updateItem' | 'removeItem'>
> = (set) => ({
  items: {},
  setItems: (items) => {
    set({ items });
  },
  addItem: (key, item) => {
    set((state) => ({
      items: {
        ...state.items,
        [key]: item,
      },
    }));
  },
  updateItem: (key, item) => {
    set((state) => ({
      items: {
        ...state.items,
        [key]: item,
      },
    }));
  },
  removeItem: (key) => {
    set((state) => {
      const newItems = { ...state.items };
      delete newItems[key];
      return { items: newItems };
    });
  },
});
