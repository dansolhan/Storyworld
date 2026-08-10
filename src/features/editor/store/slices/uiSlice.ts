import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import { DEFAULT_WORKSPACE } from '../editorWorkspace';

/**
 * Editor UI state.
 *
 * The seven "is this manager open" booleans this slice used to carry were
 * mutually exclusive, and every setter enforced that by hand — each one reset
 * the other six, and so did `setSelectedPage`, `setConnectingChoice` and
 * `setIsSelectingStartNode`. That is a single value wearing a bad costume, so
 * it is now `activeWorkspace`: illegal combinations are unrepresentable and the
 * left rail reads straight off it.
 *
 * None of this state is persisted — the autosave subscription in
 * `useEditorStore` writes an explicit whitelist of domain state only — so the
 * change needs no migration.
 */
export const createUISlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | '_hasHydrated'
    | 'setHasHydrated'
    | 'selectedPageId'
    | 'setSelectedPage'
    | 'sidebarTab'
    | 'setSidebarTab'
    | 'isEditorSidebarExpanded'
    | 'setIsEditorSidebarExpanded'
    | 'connectingChoice'
    | 'setConnectingChoice'
    | 'isSelectingStartNode'
    | 'setIsSelectingStartNode'
    | 'isDragging'
    | 'setIsDragging'
    | 'isPanning'
    | 'setIsPanning'
    | 'activeWorkspace'
    | 'setActiveWorkspace'
    | 'showAllEdges'
    | 'setShowAllEdges'
    | 'hoveredPageId'
    | 'setHoveredPageId'
    | 'lastSavedAt'
    | 'setLastSavedAt'
    | 'openDialog'
    | 'setOpenDialog'
  >
> = (set) => ({
  _hasHydrated: false,
  setHasHydrated: (state) => set({ _hasHydrated: state }),

  selectedPageId: null,
  sidebarTab: 'page' as string,
  isEditorSidebarExpanded: false,
  connectingChoice: null,
  isSelectingStartNode: false,
  isDragging: false,
  isPanning: false,
  activeWorkspace: DEFAULT_WORKSPACE,
  showAllEdges: true,
  hoveredPageId: null,
  lastSavedAt: null,
  openDialog: null,

  setActiveWorkspace: (workspace) => {
    set((state) => ({
      ...state,
      activeWorkspace: workspace,
      // Leaving the graph abandons anything that only makes sense on it.
      ...(workspace !== 'graph' && {
        selectedPageId: null,
        connectingChoice: null,
        isSelectingStartNode: false,
      }),
    }));
  },

  setSelectedPage: (pageId) => {
    set((state) => ({
      ...state,
      selectedPageId: pageId,
      sidebarTab: 'page', // reset to Page tab whenever a new page is selected
      // Selecting a page is a statement about the graph, so go there.
      ...(pageId !== null && { activeWorkspace: 'graph' as const }),
      ...(pageId === null && { isEditorSidebarExpanded: false }),
    }));
  },

  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  setIsEditorSidebarExpanded: (expanded) => {
    set({ isEditorSidebarExpanded: expanded });
  },

  setConnectingChoice: (choice) => {
    set((state) => ({
      ...state,
      connectingChoice: choice,
      isSelectingStartNode: false,
      isDragging: false,
      ...(choice !== null && { activeWorkspace: 'graph' as const }),
    }));
  },

  setIsSelectingStartNode: (isSelecting) => {
    set((state) => ({
      ...state,
      isSelectingStartNode: isSelecting,
      isDragging: false,
      isPanning: false,
      connectingChoice: null,
      ...(isSelecting && { activeWorkspace: 'graph' as const }),
    }));
  },

  setIsDragging: (dragging) => {
    set({ isDragging: dragging });
  },

  setIsPanning: (panning) => {
    set({ isPanning: panning });
  },

  setShowAllEdges: (show) => set({ showAllEdges: show }),
  setHoveredPageId: (pageId) => set({ hoveredPageId: pageId }),
  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),
  setOpenDialog: (dialog) => set({ openDialog: dialog }),
});
