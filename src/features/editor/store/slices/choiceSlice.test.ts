import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';

describe('choiceSlice', () => {
  const initialState = useEditorStore.getState();
  let rootPageId: string;

  beforeEach(() => {
    useEditorStore.setState(initialState, true);
    // Setup a root page for every choice test
    rootPageId = useEditorStore.getState().addPage(0, 0);
  });

  it('should add a choice to a specific page', () => {
    useEditorStore.getState().addChoice(rootPageId);
    const state = useEditorStore.getState();

    const rootNode = state.nodes.find(n => n.id === rootPageId);
    expect(rootNode?.data.choices?.length).toBe(1);
    expect(rootNode?.data.choices?.[0].text).toBe('New Choice...');
    // targetPageId is now optional — undefined when unconnected (v4 domain change)
    expect(rootNode?.data.choices?.[0].targetPageId).toBeUndefined();

  });

  it('should update the text of a specific choice', () => {
    useEditorStore.getState().addChoice(rootPageId);
    const choiceId = useEditorStore.getState().nodes[0].data.choices![0].id;

    useEditorStore.getState().updateChoiceText(rootPageId, choiceId, 'Open the door');

    const rootNode = useEditorStore.getState().nodes.find(n => n.id === rootPageId);
    expect(rootNode?.data.choices?.[0].text).toBe('Open the door');
  });

  it('should set choice destination and sync the graph edges automatically', () => {
    useEditorStore.getState().addChoice(rootPageId);
    const targetPageId = useEditorStore.getState().addPage(200, 0);

    const choiceId = useEditorStore.getState().nodes[0].data.choices![0].id;

    useEditorStore.getState().setChoiceDestination(rootPageId, choiceId, targetPageId);

    const state = useEditorStore.getState();
    const rootNode = state.nodes.find(n => n.id === rootPageId);

    // 1. Data correctly recorded the target ID
    expect(rootNode?.data.choices?.[0].targetPageId).toBe(targetPageId);

    // 2. An edge was seamlessly spun up for react-flow to render
    expect(state.edges.length).toBe(1);
    expect(state.edges[0].source).toBe(rootPageId);
    expect(state.edges[0].target).toBe(targetPageId);
    expect(state.edges[0].sourceHandle).toBe(choiceId);
  });

  it('should automatically create a completely new page connected to a choice', () => {
    useEditorStore.getState().addChoice(rootPageId);
    const choiceId = useEditorStore.getState().nodes[0].data.choices![0].id;

    useEditorStore.getState().createPageFromChoice(rootPageId, choiceId);

    const state = useEditorStore.getState();

    // Expect 2 nodes now (root + newly generated target)
    expect(state.nodes.length).toBe(2);
    const targetNode = state.nodes[1];

    // Expect root choice to point to the new node
    const rootNode = state.nodes[0];
    expect(rootNode.data.choices![0].targetPageId).toBe(targetNode.id);

    // Layout check: the new node should be offset to the right by 400px
    expect(targetNode.position.x).toBe(rootNode.position.x + 400);
    expect(targetNode.position.y).toBe(rootNode.position.y);
  });
});
