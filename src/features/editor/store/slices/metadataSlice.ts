import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createMetadataSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'storyTitle' | 'storyDescription' | 'startPageId' | 'setStoryTitle' | 'setStoryDescription' | 'setStartPageId'>
> = (set) => ({
  storyTitle: 'Untitled Story',
  storyDescription: '',
  startPageId: null,

  setStoryTitle: (title) => {
    set({ storyTitle: title });
  },

  setStoryDescription: (description) => {
    set({ storyDescription: description });
  },

  setStartPageId: (pageId) => {
    set({ startPageId: pageId });
  },
});
