import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createUISlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, '_hasHydrated' | 'setHasHydrated' | 'selectedPageId' | 'setSelectedPage' | 'sidebarTab' | 'setSidebarTab' | 'isEditorSidebarExpanded' | 'setIsEditorSidebarExpanded' | 'pageColorMode' | 'setPageColorMode' | 'connectingChoice' | 'setConnectingChoice' | 'isSelectingStartNode' | 'setIsSelectingStartNode' | 'isStorySettingsOpen' | 'setIsStorySettingsOpen' | 'isVariableManagerOpen' | 'setIsVariableManagerOpen' | 'isAudioManagerOpen' | 'setIsAudioManagerOpen' | 'isAtmosphereManagerOpen' | 'setIsAtmosphereManagerOpen' | 'isItemManagerOpen' | 'setIsItemManagerOpen'>
> = (set) => ({
  _hasHydrated: false,
  setHasHydrated: (state) => set({ _hasHydrated: state }),

  selectedPageId: null,
  sidebarTab: 'page' as string,
  isEditorSidebarExpanded: false,
  pageColorMode: 'type' as const,
  connectingChoice: null,
  isSelectingStartNode: false,
  isStorySettingsOpen: false,
  isVariableManagerOpen: false,
  isAudioManagerOpen: false,
  isAtmosphereManagerOpen: false,
  isItemManagerOpen: false,

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
        isAudioManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isItemManagerOpen: false,
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
      }),
    }));
  }
});
