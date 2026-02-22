import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createUISlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'selectedPageId' | 'setSelectedPage' | 'connectingChoice' | 'setConnectingChoice' | 'isSelectingStartNode' | 'setIsSelectingStartNode' | 'isStorySettingsOpen' | 'setIsStorySettingsOpen' | 'isVariableManagerOpen' | 'setIsVariableManagerOpen'>
> = (set) => ({
  selectedPageId: null,
  connectingChoice: null,
  isSelectingStartNode: false,
  isStorySettingsOpen: false,
  isVariableManagerOpen: false,

  setSelectedPage: (pageId) => {
    set({ selectedPageId: pageId });
  },

  setConnectingChoice: (choice) => {
    set({ connectingChoice: choice });
  },

  setIsSelectingStartNode: (isSelecting) => {
    set({ isSelectingStartNode: isSelecting });
  },

  setIsStorySettingsOpen: (isOpen) => {
    set({ isStorySettingsOpen: isOpen });
  },

  setIsVariableManagerOpen: (isOpen) => {
    set({ isVariableManagerOpen: isOpen });
  }
});
