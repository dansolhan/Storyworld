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
    set((state) => ({
      ...state,
      selectedPageId: pageId,
      ...(pageId !== null && {
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
      }),
    }));
  },

  setConnectingChoice: (choice) => {
    set({ connectingChoice: choice });
  },

  setIsSelectingStartNode: (isSelecting) => {
    set({ isSelectingStartNode: isSelecting });
  },

  setIsStorySettingsOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isStorySettingsOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isVariableManagerOpen: false,
      }),
    }));
  },

  setIsVariableManagerOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isVariableManagerOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isStorySettingsOpen: false,
      }),
    }));
  }
});
