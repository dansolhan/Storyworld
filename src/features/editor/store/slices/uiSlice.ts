import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createUISlice: StateCreator<
  EditorState,
  [],
  [],
    Pick<EditorState, '_hasHydrated' | 'setHasHydrated' | 'selectedPageId' | 'setSelectedPage' | 'sidebarTab' | 'setSidebarTab' | 'isEditorSidebarExpanded' | 'setIsEditorSidebarExpanded' | 'pageColorMode' | 'setPageColorMode' | 'connectingChoice' | 'setConnectingChoice' | 'isSelectingStartNode' | 'setIsSelectingStartNode' | 'isDragging' | 'setIsDragging' | 'isPanning' | 'setIsPanning' | 'isStorySettingsOpen' | 'setIsStorySettingsOpen' | 'isVariableManagerOpen' | 'setIsVariableManagerOpen' | 'isAudioManagerOpen' | 'setIsAudioManagerOpen' | 'isAtmosphereManagerOpen' | 'setIsAtmosphereManagerOpen' | 'isItemManagerOpen' | 'setIsItemManagerOpen' | 'isStatusDataManagerOpen' | 'setIsStatusDataManagerOpen' | 'isContextManagerOpen' | 'setIsContextManagerOpen' | 'showAllEdges' | 'setShowAllEdges' | 'hoveredPageId' | 'setHoveredPageId'>
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
  isPanning: false,
  isStorySettingsOpen: false,
  isVariableManagerOpen: false,
  isAudioManagerOpen: false,
  isAtmosphereManagerOpen: false,
  isItemManagerOpen: false,
  isStatusDataManagerOpen: false,
  isContextManagerOpen: false,
  showAllEdges: true,
  hoveredPageId: null,

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
        isContextManagerOpen: false,
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
      isContextManagerOpen: false,
    });
  },

  setIsSelectingStartNode: (isSelecting) => {
    set({
      isSelectingStartNode: isSelecting,
      isDragging: false,
      isPanning: false,
      isStorySettingsOpen: false,
      isVariableManagerOpen: false,
      isAudioManagerOpen: false,
      isAtmosphereManagerOpen: false,
      isItemManagerOpen: false,
      isStatusDataManagerOpen: false,
      isContextManagerOpen: false,
      connectingChoice: null,
    });
  },

  setIsDragging: (dragging) => {
    set({ isDragging: dragging });
  },

  setIsPanning: (panning) => {
    set({ isPanning: panning });
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
        isContextManagerOpen: false,
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
        isContextManagerOpen: false,
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
        isContextManagerOpen: false,
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
        isContextManagerOpen: false,
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
        isContextManagerOpen: false,
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
        isContextManagerOpen: false,
      }),
    }));
  },

  setIsContextManagerOpen: (isOpen) => {
    set((state) => ({
      ...state,
      isContextManagerOpen: isOpen,
      ...(isOpen && {
        selectedPageId: null,
        isStorySettingsOpen: false,
        isVariableManagerOpen: false,
        isAudioManagerOpen: false,
        isAtmosphereManagerOpen: false,
        isItemManagerOpen: false,
        isStatusDataManagerOpen: false,
      }),
    }));
  },
  
  setShowAllEdges: (show) => set({ showAllEdges: show }),
  setHoveredPageId: (pageId) => set({ hoveredPageId: pageId }),
});
