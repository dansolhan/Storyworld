// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { PageNode, type PageNodeData } from './PageNode';
import { useEditorStore } from '../store/useEditorStore';
import type { Page } from '../../../domain/Page/Page';
import type { NodeProps } from '@xyflow/react';
import type { PageNodeType } from './PageNode';

const pristineState = useEditorStore.getState();

const page = (over: Partial<Page> = {}): Page => ({
  id: 'page-1',
  title: 'The Locked Door',
  type: 'location',
  paragraphs: [],
  choices: [],
  ...over,
});

const renderNode = (data: Partial<PageNodeData> = {}) => {
  const props = {
    id: 'page-1',
    data: { type: 'location', title: 'The Locked Door', paragraphs: [], choices: [], ...data },
    selected: false,
    type: 'pageNode',
    dragging: false,
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as unknown as NodeProps<PageNodeType>;

  render(
    <ReactFlowProvider>
      <PageNode {...props} />
    </ReactFlowProvider>
  );
};

const kicker = (): string => screen.getByText(/Location|Plot|Editing/).textContent ?? '';

describe('PageNode', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  it('marks a page with no prose as unwritten, keeping its type', () => {
    useEditorStore.setState({ pages: { 'page-1': page() } });
    renderNode();

    expect(kicker()).toBe('Location · Unwritten');
  });

  it('drops the mark as soon as there is prose', () => {
    useEditorStore.setState({
      pages: { 'page-1': page({ paragraphs: [{ id: 'p1', text: '<p>The door is oak.</p>' }] }) },
    });
    renderNode();

    expect(kicker()).toBe('Location');
  });

  /*
   * A dashed border already means "plot / action", so unwritten cannot also be
   * dashed — it dims instead, and both facts stay readable at once.
   */
  it('says a plot page is unwritten without giving up either fact', () => {
    useEditorStore.setState({ pages: { 'page-1': page({ type: 'plot' }) } });
    renderNode({ type: 'plot' });

    expect(kicker()).toBe('Plot / Action · Unwritten');
    expect(document.querySelector('[data-plot][data-unwritten]')).toBeTruthy();
  });

  it('lists start and unwritten together', () => {
    useEditorStore.setState({ pages: { 'page-1': page() }, startPageId: 'page-1' });
    renderNode();

    expect(kicker()).toBe('Location · Start · Unwritten');
  });

  it('says Editing instead, because that is what you need to know then', () => {
    useEditorStore.setState({ pages: { 'page-1': page() }, selectedPageId: 'page-1' });
    renderNode();

    expect(screen.getByText('Editing')).toBeTruthy();
    expect(screen.queryByText(/Unwritten/)).toBeNull();
  });

  it('counts what is on the page', () => {
    useEditorStore.setState({
      pages: {
        'page-1': page({
          choices: [{ id: 'c1', text: 'Open it' }],
          events: [{ id: 'e1', name: 'onEnter', logicTree: [] }],
        }),
      },
    });
    renderNode();

    expect(screen.getByText('1 choice · 1 event')).toBeTruthy();
  });
});
