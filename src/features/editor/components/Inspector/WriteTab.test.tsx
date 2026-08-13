// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WriteTab } from './WriteTab';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page } from '../../../../domain/Page/Page';

const pristineState = useEditorStore.getState();

/* Mirrors the Inspector: the page comes from the store, so an edit comes back. */
const LiveWrite: React.FC<{ pageId: string }> = ({ pageId }) => {
  const stored = useEditorStore((state) => state.pages[pageId]);
  return stored ? <WriteTab page={stored} /> : null;
};

const page = (id: string): Page => useEditorStore.getState().pages[id];

describe('WriteTab', () => {
  let pageId: string;

  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
    pageId = useEditorStore.getState().addPage(0, 0);
    useEditorStore.getState().updatePageTitle(pageId, 'The Locked Door');
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  /*
   * The title moved here from Settings: it is the first thing you write, and the
   * player sets it as the page's headline directly above this prose.
   */
  it('writes the page title alongside the prose', async () => {
    render(<LiveWrite pageId={pageId} />);
    const title = screen.getByRole('textbox', { name: 'Title' });

    expect(title).toHaveProperty('value', 'The Locked Door');

    await userEvent.clear(title);
    await userEvent.type(title, 'The Oak Door');

    expect(page(pageId).title).toBe('The Oak Door');
  });

  it('says a page is untitled rather than showing an empty field', async () => {
    useEditorStore.getState().updatePageTitle(pageId, '');
    render(<LiveWrite pageId={pageId} />);

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveProperty(
      'placeholder',
      'Untitled page'
    );
  });

  it('says so plainly when nothing is written yet', () => {
    render(<LiveWrite pageId={pageId} />);
    expect(screen.getByText('Nothing written yet.')).toBeTruthy();
  });
});
