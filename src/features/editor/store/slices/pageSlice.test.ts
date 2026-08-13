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

  describe('deletePage', () => {
    /*
     * React Flow's own delete only removes the node, so `pages[id]` used to be
     * left behind as an orphan the compiler still emitted. These pin the four
     * places a page exists.
     */
    const twoLinkedPages = () => {
      const first = useEditorStore.getState().addPage(0, 0);
      const second = useEditorStore.getState().addPage(300, 0);
      useEditorStore.getState().addChoice(first);
      const choiceId = useEditorStore.getState().pages[first].choices[0].id;
      useEditorStore.getState().setChoiceDestination(first, choiceId, second);
      return { first, second, choiceId };
    };

    it('removes the page record and its node together', () => {
      const { second } = twoLinkedPages();

      useEditorStore.getState().deletePage(second);
      const state = useEditorStore.getState();

      expect(state.pages[second]).toBeUndefined();
      expect(state.nodes.find((node) => node.id === second)).toBeUndefined();
    });

    it('unlinks any choice that pointed at it, rather than leaving a dangling id', () => {
      const { first, second, choiceId } = twoLinkedPages();

      useEditorStore.getState().deletePage(second);
      const state = useEditorStore.getState();

      expect(state.pages[first].choices.find((c) => c.id === choiceId)?.targetPageId).toBeUndefined();
      expect(state.edges.filter((edge) => edge.target === second)).toEqual([]);
    });

    it('drops the edges leaving the deleted page too', () => {
      const { first, second } = twoLinkedPages();

      useEditorStore.getState().deletePage(first);

      expect(useEditorStore.getState().edges.filter((edge) => edge.source === first)).toEqual([]);
      expect(useEditorStore.getState().pages[second]).toBeDefined();
    });

    it('clears the selection and the start page when they were the deleted page', () => {
      const pageId = useEditorStore.getState().addPage(0, 0);
      useEditorStore.getState().setSelectedPage(pageId);
      useEditorStore.getState().setStartPageId(pageId);

      useEditorStore.getState().deletePage(pageId);
      const state = useEditorStore.getState();

      expect(state.selectedPageId).toBeNull();
      expect(state.startPageId).toBeNull();
    });

    it('leaves an unrelated selection alone', () => {
      const { first, second } = twoLinkedPages();
      useEditorStore.getState().setSelectedPage(first);

      useEditorStore.getState().deletePage(second);

      expect(useEditorStore.getState().selectedPageId).toBe(first);
    });

    it('ignores a page that is not there', () => {
      const { first } = twoLinkedPages();
      const before = useEditorStore.getState();

      useEditorStore.getState().deletePage('no-such-page');
      const after = useEditorStore.getState();

      expect(after.pages).toBe(before.pages);
      expect(after.nodes).toBe(before.nodes);
      expect(after.pages[first]).toBeDefined();
    });
  });
});
