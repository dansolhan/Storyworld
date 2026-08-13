// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { useBranchToNewPage } from './useBranchToNewPage';
import { useEditorStore } from '../../store/useEditorStore';
import { useToastStore } from '../../../../components/ui/Toast/useToastStore';
import type { Page } from '../../../../domain/Page/Page';
import type { EditorNode } from '../../store/editorTypes';

const pristineState = useEditorStore.getState();

const node = (id: string, x = 0): EditorNode => ({
  id,
  type: 'pageNode',
  position: { x, y: 0 },
  data: { type: 'location', title: id, paragraphs: [], choices: [] },
});

const page = (id: string, choices: Page['choices'] = []): Page => ({
  id,
  title: id,
  paragraphs: [],
  choices,
});

const seed = (targetPageId?: string) => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    pages: {
      'page-1': page('page-1', [{ id: 'choice-1', text: 'Open the door', targetPageId }]),
      'page-2': page('page-2'),
    },
    nodes: [node('page-1'), node('page-2', 400)],
    edges: targetPageId
      ? [{ id: 'e1', source: 'page-1', sourceHandle: 'choice-1', target: 'page-2' }]
      : [],
  });
};

const branch = () =>
  renderHook(() => useBranchToNewPage(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ReactFlowProvider>{children}</ReactFlowProvider>
    ),
  }).result;

const choiceTarget = (): string | undefined =>
  useEditorStore.getState().pages['page-1'].choices[0].targetPageId;

const newPageId = (): string =>
  Object.keys(useEditorStore.getState().pages).find((id) => !['page-1', 'page-2'].includes(id))!;

describe('useBranchToNewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    seed();
    useToastStore.setState({ toast: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    useEditorStore.setState(pristineState, true);
    useToastStore.setState({ toast: null });
  });

  it('creates a page and points the choice at it', () => {
    const result = branch();
    act(() => result.current('page-1', 'choice-1'));

    const created = newPageId();
    expect(choiceTarget()).toBe(created);
    expect(useEditorStore.getState().nodes.map((n) => n.id)).toContain(created);
    expect(useEditorStore.getState().pages[created].paragraphs).toEqual([]);
  });

  it('leaves the selection where it was, so the choice list keeps focus', () => {
    useEditorStore.setState({ selectedPageId: 'page-1' });
    const result = branch();
    act(() => result.current('page-1', 'choice-1'));

    expect(useEditorStore.getState().selectedPageId).toBe('page-1');
  });

  it('offers to undo, and says the choice was repointed when it was', () => {
    seed('page-2');
    const result = branch();
    act(() => result.current('page-1', 'choice-1'));

    const toast = useToastStore.getState().toast!;
    expect(toast.message).toContain('repointed');
    expect(toast.action?.label).toBe('Undo');
  });

  it('says only that a page was created when the choice had no target', () => {
    const result = branch();
    act(() => result.current('page-1', 'choice-1'));

    expect(useToastStore.getState().toast!.message).toBe('New page created.');
  });

  it('undo deletes the page and restores the previous target', () => {
    seed('page-2');
    const result = branch();
    act(() => result.current('page-1', 'choice-1'));
    const created = newPageId();

    act(() => useToastStore.getState().toast!.action!.onClick());

    expect(useEditorStore.getState().pages[created]).toBeUndefined();
    expect(useEditorStore.getState().nodes.map((n) => n.id)).not.toContain(created);
    expect(choiceTarget()).toBe('page-2');
  });

  it('undo on a choice that had no target leaves it unlinked', () => {
    const result = branch();
    act(() => result.current('page-1', 'choice-1'));
    const created = newPageId();

    act(() => useToastStore.getState().toast!.action!.onClick());

    expect(useEditorStore.getState().pages[created]).toBeUndefined();
    expect(choiceTarget()).toBeUndefined();
  });

  it('does nothing for a choice that is not there', () => {
    const result = branch();
    act(() => result.current('page-1', 'no-such-choice'));

    expect(Object.keys(useEditorStore.getState().pages)).toHaveLength(2);
    expect(useToastStore.getState().toast).toBeNull();
  });
});
