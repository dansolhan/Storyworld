import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';

describe('pageSlice', () => {
  const initialState = useEditorStore.getState();

  beforeEach(() => {
    useEditorStore.setState(initialState, true);
  });

  it('should add a new page to the nodes array with correct coordinates', () => {
    const newPageId = useEditorStore.getState().addPage(100, 200);
    const state = useEditorStore.getState();

    expect(state.nodes.length).toBe(1);

    const addedNode = state.nodes[0];
    expect(addedNode.id).toBe(newPageId);
    expect(addedNode.type).toBe('pageNode');
    expect(addedNode.position).toEqual({ x: 100, y: 200 });
    expect(addedNode.data.type).toBe('location');
    expect(addedNode.data.title).toBe('New Page');
    expect(addedNode.data.paragraphs).toEqual([]);
    expect(addedNode.data.choices).toEqual([]);
  });

  it('should update the title of an existing page', () => {
    const pageId = useEditorStore.getState().addPage(0, 0);

    useEditorStore.getState().updatePageTitle(pageId, 'The Throne Room');
    const state = useEditorStore.getState();

    expect(state.nodes[0].data.title).toBe('The Throne Room');
  });

  it('should not mutate other nodes when updating title', () => {
    const page1Id = useEditorStore.getState().addPage(0, 0);
    const page2Id = useEditorStore.getState().addPage(100, 100);

    useEditorStore.getState().updatePageTitle(page1Id, 'Room A');
    const state = useEditorStore.getState();

    expect(state.nodes.find(n => n.id === page1Id)?.data.title).toBe('Room A');
    expect(state.nodes.find(n => n.id === page2Id)?.data.title).toBe('New Page');
  });

  it('should update the type of an existing page', () => {
    const pageId = useEditorStore.getState().addPage(0, 0);

    useEditorStore.getState().updatePageType(pageId, 'plot');
    const state = useEditorStore.getState();

    expect(state.nodes[0].data.type).toBe('plot');
  });
});
