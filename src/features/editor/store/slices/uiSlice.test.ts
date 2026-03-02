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
    expect(state.isStorySettingsOpen).toBe(false);
    expect(state.isVariableManagerOpen).toBe(false);
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

  it('should mutually exclude bottom drawers', () => {
    useEditorStore.getState().setIsStorySettingsOpen(true);
    expect(useEditorStore.getState().isStorySettingsOpen).toBe(true);

    useEditorStore.getState().setIsVariableManagerOpen(true);
    expect(useEditorStore.getState().isVariableManagerOpen).toBe(true);
    expect(useEditorStore.getState().isStorySettingsOpen).toBe(false);

    useEditorStore.getState().setSelectedPage('page-1');
    expect(useEditorStore.getState().selectedPageId).toBe('page-1');
    expect(useEditorStore.getState().isVariableManagerOpen).toBe(false);
  });
});
