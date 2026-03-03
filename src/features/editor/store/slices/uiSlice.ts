import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createUISlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, '_hasHydrated' | 'setHasHydrated' | 'selectedPageId' | 'setSelectedPage' | 'sidebarTab' | 'setSidebarTab' | 'isEditorSidebarExpanded' | 'setIsEditorSidebarExpanded' | 'connectingChoice' | 'setConnectingChoice' | 'isSelectingStartNode' | 'setIsSelectingStartNode' | 'isStorySettingsOpen' | 'setIsStorySettingsOpen' | 'isVariableManagerOpen' | 'setIsVariableManagerOpen'>
> = (set) => ({
  _hasHydrated: false,
  setHasHydrated: (state) => set({ _hasHydrated: state }),

  selectedPageId: null,
  sidebarTab: 'page' as string,
  isEditorSidebarExpanded: false,
  connectingChoice: null,
  isSelectingStartNode: false,
  isStorySettingsOpen: false,
  isVariableManagerOpen: false,

  setSelectedPage: (pageId) => {
    set((state) => ({
      ...state,
      selectedPageId: pageId,
      sidebarTab: 'page', // reset to Page tab whenever a new page is selected
      ...(pageId !== null && {
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
      }),
      ...(pageId === null && {
        isEditorSidebarExpanded: false,
      })
    }));
  },

  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  setIsEditorSidebarExpanded: (expanded) => {
    set({ isEditorSidebarExpanded: expanded });
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
