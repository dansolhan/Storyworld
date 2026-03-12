import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createUISlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, '_hasHydrated' | 'setHasHydrated' | 'selectedPageId' | 'setSelectedPage' | 'sidebarTab' | 'setSidebarTab' | 'isEditorSidebarExpanded' | 'setIsEditorSidebarExpanded' | 'pageColorMode' | 'setPageColorMode' | 'connectingChoice' | 'setConnectingChoice' | 'isSelectingStartNode' | 'setIsSelectingStartNode' | 'isDragging' | 'setIsDragging' | 'isStorySettingsOpen' | 'setIsStorySettingsOpen' | 'isVariableManagerOpen' | 'setIsVariableManagerOpen' | 'isAudioManagerOpen' | 'setIsAudioManagerOpen' | 'isAtmosphereManagerOpen' | 'setIsAtmosphereManagerOpen' | 'isItemManagerOpen' | 'setIsItemManagerOpen' | 'isStatusDataManagerOpen' | 'setIsStatusDataManagerOpen'>
> = (set) => ({
  _hasHydrated: false,
  setHasHydrated: (state) => set({ _hasHydrated: state }),

  selectedPageId: null,
  sidebarTab: 'page' as string,
  isEditorSidebarExpanded: false,
  pageColorMode: 'type' as const,
  connectingChoice: null,
  isSelectingStartNode: false,
  isDragging: false,
  isStorySettingsOpen: false,
  isVariableManagerOpen: false,
  isAudioManagerOpen: false,
  isAtmosphereManagerOpen: false,
  isItemManagerOpen: false,
  isStatusDataManagerOpen: false,

  setSelectedPage: (pageId) => {
    set((state) => ({
      ...state,
      selectedPageId: pageId,
      sidebarTab: 'page', // reset to Page tab whenever a new page is selected
      ...(pageId !== null && {
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
        isAudioManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isItemManagerOpen: false,
        isStatusDataManagerOpen: false,
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

  setPageColorMode: (mode) => {
    set({ pageColorMode: mode });
  },

  setConnectingChoice: (choice) => {
    set({
      connectingChoice: choice,
      isSelectingStartNode: false,
      isDragging: false,
      isStorySettingsOpen: false,
      isVariableManagerOpen: false,
      isAudioManagerOpen: false,
      isAtmosphereManagerOpen: false,
      isItemManagerOpen: false,
      isStatusDataManagerOpen: false,
    });
  },

  setIsSelectingStartNode: (isSelecting) => {
    set({ isSelectingStartNode: isSelecting });
  },

  setIsDragging: (dragging) => {
    set({ isDragging: dragging });
  },

  setIsStorySettingsOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isStorySettingsOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isVariableManagerOpen: false,
        isAudioManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isItemManagerOpen: false,
        isStatusDataManagerOpen: false,
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
        isAudioManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isItemManagerOpen: false,
        isStatusDataManagerOpen: false,
      }),
    }));
  },

  setIsAudioManagerOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isAudioManagerOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isItemManagerOpen: false,
        isStatusDataManagerOpen: false,
      }),
    }));
  },

  setIsAtmosphereManagerOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isAtmosphereManagerOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
        isAudioManagerOpen: false,
        isItemManagerOpen: false,
        isStatusDataManagerOpen: false,
      }),
    }));
  },

  setIsItemManagerOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isItemManagerOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
        isAudioManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isStatusDataManagerOpen: false,
      }),
    }));
  },

  setIsStatusDataManagerOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isStatusDataManagerOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
        isAudioManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isItemManagerOpen: false,
      }),
    }));
  }
});
