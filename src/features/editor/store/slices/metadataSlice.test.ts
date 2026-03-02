import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';

describe('metadataSlice', () => {
  const initialState = useEditorStore.getState();

  beforeEach(() => {
    // Reset store to pure initial state before each test
    useEditorStore.setState(initialState, true);
  });

  it('should initialize with default metadata', () => {
    const state = useEditorStore.getState();
    expect(state.storyTitle).toBe('Untitled Story');
    expect(state.storyDescription).toBe('');
    expect(state.startPageId).toBeNull();
  });

  it('should update storyTitle', () => {
    useEditorStore.getState().setStoryTitle('The Haunted Mansion');
    expect(useEditorStore.getState().storyTitle).toBe('The Haunted Mansion');
  });

  it('should update storyDescription', () => {
    useEditorStore.getState().setStoryDescription('A spooky tale.');
    expect(useEditorStore.getState().storyDescription).toBe('A spooky tale.');
  });

  it('should update startPageId', () => {
    useEditorStore.getState().setStartPageId('page-999');
    expect(useEditorStore.getState().startPageId).toBe('page-999');
  });
});
