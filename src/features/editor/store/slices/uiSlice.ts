import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createUISlice: StateCreator<EditorState, [], [], Pick<EditorState, 'selectedPageId' | 'setSelectedPage'>> = (set) => ({
  selectedPageId: null,

  setSelectedPage: (pageId) => {
    set({ selectedPageId: pageId });
  },
});
