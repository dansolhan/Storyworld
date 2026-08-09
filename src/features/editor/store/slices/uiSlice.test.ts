import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';

describe('uiSlice', () => {
  const initialState = useEditorStore.getState();

  beforeEach(() => {
    // Reset store to pure initial state before each test
    useEditorStore.setState(initialState, true);
  });

  it('should initialize with default UI states', () => {
    const state = useEditorStore.getState();
    expect(state.selectedPageId).toBeNull();
    expect(state.connectingChoice).toBeNull();
    expect(state.isSelectingStartNode).toBe(false);
    expect(state.activeWorkspace).toBe('graph');
    expect(state.lastSavedAt).toBeNull();
  });

  it('should successfully update selectedPageId', () => {
    useEditorStore.getState().setSelectedPage('page-abc');
    expect(useEditorStore.getState().selectedPageId).toBe('page-abc');

    // Test deselecting
    useEditorStore.getState().setSelectedPage(null);
    expect(useEditorStore.getState().selectedPageId).toBeNull();
  });

  it('should manage connectingChoice state', () => {
    const payload = { sourcePageId: 'page-1', choiceId: 'choice-1' };
    useEditorStore.getState().setConnectingChoice(payload);
    expect(useEditorStore.getState().connectingChoice).toEqual(payload);
  });

  it('should toggle isSelectingStartNode', () => {
    useEditorStore.getState().setIsSelectingStartNode(true);
    expect(useEditorStore.getState().isSelectingStartNode).toBe(true);
  });

  describe('activeWorkspace', () => {
    it('holds only one workspace at a time', () => {
      useEditorStore.getState().setActiveWorkspace('settings');
      expect(useEditorStore.getState().activeWorkspace).toBe('settings');

      useEditorStore.getState().setActiveWorkspace('variables');
      expect(useEditorStore.getState().activeWorkspace).toBe('variables');
    });

    it('abandons graph-only state when leaving the graph', () => {
      useEditorStore.getState().setSelectedPage('page-1');
      useEditorStore.getState().setConnectingChoice({ sourcePageId: 'page-1', choiceId: 'choice-1' });

      useEditorStore.getState().setActiveWorkspace('items');

      const state = useEditorStore.getState();
      expect(state.activeWorkspace).toBe('items');
      expect(state.selectedPageId).toBeNull();
      expect(state.connectingChoice).toBeNull();
      expect(state.isSelectingStartNode).toBe(false);
    });

    it('keeps the current selection when returning to the graph', () => {
      useEditorStore.getState().setSelectedPage('page-1');
      useEditorStore.getState().setActiveWorkspace('graph');

      expect(useEditorStore.getState().selectedPageId).toBe('page-1');
    });

    it('returns to the graph when a page is selected', () => {
      useEditorStore.getState().setActiveWorkspace('audio');
      useEditorStore.getState().setSelectedPage('page-1');

      const state = useEditorStore.getState();
      expect(state.activeWorkspace).toBe('graph');
      expect(state.selectedPageId).toBe('page-1');
    });

    it('returns to the graph when a choice connection starts', () => {
      useEditorStore.getState().setActiveWorkspace('context');
      useEditorStore.getState().setConnectingChoice({ sourcePageId: 'page-1', choiceId: 'choice-1' });

      expect(useEditorStore.getState().activeWorkspace).toBe('graph');
    });

    it('returns to the graph when picking a start node', () => {
      useEditorStore.getState().setActiveWorkspace('statusData');
      useEditorStore.getState().setIsSelectingStartNode(true);

      expect(useEditorStore.getState().activeWorkspace).toBe('graph');
    });

    it('does not leave the graph merely because a selection was cleared', () => {
      useEditorStore.getState().setSelectedPage('page-1');
      useEditorStore.getState().setSelectedPage(null);

      expect(useEditorStore.getState().activeWorkspace).toBe('graph');
    });
  });

  describe('lastSavedAt', () => {
    it('records the timestamp it is given', () => {
      useEditorStore.getState().setLastSavedAt(1_700_000_000_000);
      expect(useEditorStore.getState().lastSavedAt).toBe(1_700_000_000_000);
    });
  });
});
