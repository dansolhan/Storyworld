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

  describe('deleting through the canvas', () => {
    /*
     * The rot this closes: React Flow's `remove` change used to be applied to `nodes`
     * alone, so the page record, its edges and every choice pointing at it survived —
     * invisible, unreachable, and still emitted by the compiler.
     */
    const linkedPair = () => {
      const first = useEditorStore.getState().addPage(0, 0);
      const second = useEditorStore.getState().addPage(300, 0);
      useEditorStore.getState().addChoice(first);
      const choiceId = useEditorStore.getState().pages[first].choices[0].id;
      useEditorStore.getState().setChoiceDestination(first, choiceId, second);
      return { first, second, choiceId };
    };

    it('routes a node removal through deletePage', () => {
      const { first, second, choiceId } = linkedPair();

      useEditorStore.getState().onNodesChange([{ id: second, type: 'remove' }]);
      const state = useEditorStore.getState();

      expect(state.pages[second]).toBeUndefined();
      expect(state.nodes.find((node) => node.id === second)).toBeUndefined();
      expect(state.pages[first].choices.find((c) => c.id === choiceId)?.targetPageId).toBeUndefined();
    });

    it('still applies the changes that are not removals', () => {
      const { first } = linkedPair();

      useEditorStore.getState().onNodesChange([{ id: first, type: 'select', selected: true }]);

      expect(useEditorStore.getState().nodes.find((node) => node.id === first)?.selected).toBe(true);
    });

    /* A crossing card is derived from a choice; deleting it would only bring it back. */
    it('refuses to delete a synthetic node', () => {
      const pageId = useEditorStore.getState().addPage(0, 0);
      useEditorStore.getState().addChoice(pageId);
      const choiceId = useEditorStore.getState().pages[pageId].choices[0].id;
      useEditorStore.getState().updateEventLogicTree('choice', pageId, choiceId, 'missing', []);

      const before = useEditorStore.getState().nodes.length;
      useEditorStore.getState().onNodesChange([{ id: 'action-node-nope', type: 'remove' }]);

      expect(useEditorStore.getState().nodes).toHaveLength(before);
    });

    it('reports what it deleted, so it can be offered back', () => {
      const { first, second, choiceId } = linkedPair();
      useEditorStore.getState().updatePageTitle(second, 'The Sunken Hall');

      const deleted = useEditorStore.getState().onNodesChange([{ id: second, type: 'remove' }]);

      expect(deleted).toHaveLength(1);
      expect(deleted[0].page.title).toBe('The Sunken Hall');
      expect(deleted[0].inbound).toEqual([{ pageId: first, choiceId }]);
    });
  });

  describe('restoreDeletedPage', () => {
    it('puts the page, its position and its inbound choice back', () => {
      const first = useEditorStore.getState().addPage(0, 0);
      const second = useEditorStore.getState().addPage(300, 120);
      useEditorStore.getState().addChoice(first);
      const choiceId = useEditorStore.getState().pages[first].choices[0].id;
      useEditorStore.getState().setChoiceDestination(first, choiceId, second);
      useEditorStore.getState().updatePageTitle(second, 'The Sunken Hall');

      const [deleted] = useEditorStore.getState().onNodesChange([{ id: second, type: 'remove' }]);
      useEditorStore.getState().restoreDeletedPage(deleted);
      const state = useEditorStore.getState();

      expect(state.pages[second].title).toBe('The Sunken Hall');
      expect(state.nodes.find((node) => node.id === second)?.position).toEqual({ x: 300, y: 120 });
      expect(state.pages[first].choices.find((c) => c.id === choiceId)?.targetPageId).toBe(second);
      expect(state.edges.filter((edge) => edge.target === second)).toHaveLength(1);
    });

    it('gives back the start page role when it had it', () => {
      const pageId = useEditorStore.getState().addPage(0, 0);
      useEditorStore.getState().setStartPageId(pageId);

      const [deleted] = useEditorStore.getState().onNodesChange([{ id: pageId, type: 'remove' }]);
      expect(useEditorStore.getState().startPageId).toBeNull();

      useEditorStore.getState().restoreDeletedPage(deleted);
      expect(useEditorStore.getState().startPageId).toBe(pageId);
    });

    /* An author who deletes, edits elsewhere, then undoes should keep the edit. */
    it('leaves an unrelated edit made in the meantime alone', () => {
      const first = useEditorStore.getState().addPage(0, 0);
      const second = useEditorStore.getState().addPage(300, 0);

      const [deleted] = useEditorStore.getState().onNodesChange([{ id: second, type: 'remove' }]);
      useEditorStore.getState().updatePageTitle(first, 'Still here');
      useEditorStore.getState().restoreDeletedPage(deleted);

      expect(useEditorStore.getState().pages[first].title).toBe('Still here');
      expect(useEditorStore.getState().pages[second]).toBeDefined();
    });
  });
});
