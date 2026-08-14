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

  describe('updatePageSubplot', () => {
    /*
     * The capability this adds: `addPage` was the only thing that ever set
     * `subplotId`, so a page written in the wrong plot was stuck there for good.
     */
    it('moves a page into a subplot', () => {
      const pageId = useEditorStore.getState().addPage(0, 0);
      useEditorStore.getState().addSubplot('The Cellar', 'Below the room');
      const subplotId = useEditorStore.getState().subplots[0].id;

      useEditorStore.getState().updatePageSubplot(pageId, subplotId);

      expect(useEditorStore.getState().pages[pageId].subplotId).toBe(subplotId);
    });

    it('copies the move onto the node, so the canvas agrees', () => {
      const pageId = useEditorStore.getState().addPage(0, 0);
      useEditorStore.getState().addSubplot('The Cellar', '');
      const subplotId = useEditorStore.getState().subplots[0].id;

      useEditorStore.getState().updatePageSubplot(pageId, subplotId);

      expect(
        useEditorStore.getState().nodes.find((node) => node.id === pageId)?.data.subplotId
      ).toBe(subplotId);
    });

    it('moves a page back out to the main plot', () => {
      useEditorStore.getState().addSubplot('The Cellar', '');
      const subplotId = useEditorStore.getState().subplots[0].id;
      useEditorStore.getState().setCurrentPlotId(subplotId);
      const pageId = useEditorStore.getState().addPage(0, 0);
      expect(useEditorStore.getState().pages[pageId].subplotId).toBe(subplotId);

      useEditorStore.getState().updatePageSubplot(pageId, undefined);

      expect(useEditorStore.getState().pages[pageId].subplotId).toBeUndefined();
    });

    it('ignores a page that is not there', () => {
      const before = useEditorStore.getState().pages;
      useEditorStore.getState().updatePageSubplot('nope', undefined);
      expect(useEditorStore.getState().pages).toBe(before);
    });
  });

  describe('duplicatePage', () => {
    const written = () => {
      const pageId = useEditorStore.getState().addPage(40, 60);
      useEditorStore.getState().updatePageTitle(pageId, 'The Locked Door');
      useEditorStore.getState().addParagraph(pageId);
      useEditorStore.getState().addChoice(pageId);
      return pageId;
    };

    it('copies the prose and the choices', () => {
      const source = written();
      const copyId = useEditorStore.getState().duplicatePage(source)!;
      const copy = useEditorStore.getState().pages[copyId];

      expect(copy.title).toBe('The Locked Door (copy)');
      expect(copy.paragraphs).toHaveLength(1);
      expect(copy.choices).toHaveLength(1);
    });

    /* Sharing ids would mean editing one edited both. */
    it('gives the copy fresh ids throughout', () => {
      const source = written();
      const copyId = useEditorStore.getState().duplicatePage(source)!;
      const original = useEditorStore.getState().pages[source];
      const copy = useEditorStore.getState().pages[copyId];

      expect(copyId).not.toBe(source);
      expect(copy.paragraphs[0].id).not.toBe(original.paragraphs[0].id);
      expect(copy.choices[0].id).not.toBe(original.choices[0].id);
    });

    it('lands beside the original rather than on top of it', () => {
      const source = written();
      const copyId = useEditorStore.getState().duplicatePage(source)!;
      const node = useEditorStore.getState().nodes.find((entry) => entry.id === copyId);

      expect(node?.position).toEqual({ x: 240, y: 140 });
    });

    /* An author decides what reaches the copy; it is not silently linked. */
    it('leaves nothing pointing at the copy', () => {
      const first = written();
      const second = useEditorStore.getState().addPage(400, 0);
      const choiceId = useEditorStore.getState().pages[first].choices[0].id;
      useEditorStore.getState().setChoiceDestination(first, choiceId, second);

      const copyId = useEditorStore.getState().duplicatePage(second)!;

      const inbound = Object.values(useEditorStore.getState().pages).flatMap((page) =>
        page.choices.filter((choice) => choice.targetPageId === copyId)
      );
      expect(inbound).toEqual([]);
    });

    it('keeps the copy in the same plot as the original', () => {
      useEditorStore.getState().addSubplot('The Cellar', '');
      const subplotId = useEditorStore.getState().subplots[0].id;
      const source = written();
      useEditorStore.getState().updatePageSubplot(source, subplotId);

      const copyId = useEditorStore.getState().duplicatePage(source)!;

      expect(useEditorStore.getState().pages[copyId].subplotId).toBe(subplotId);
    });

    it('has nothing to copy for a page that is not there', () => {
      expect(useEditorStore.getState().duplicatePage('nope')).toBeUndefined();
    });
  });
});
