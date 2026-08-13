// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsTab } from './SettingsTab';
import { useEditorStore } from '../../store/useEditorStore';
import { useToastStore } from '../../../../components/ui/Toast/useToastStore';
import type { Page } from '../../../../domain/Page/Page';

const pristineState = useEditorStore.getState();

const seed = () => {
  useEditorStore.setState(pristineState, true);
  const first = useEditorStore.getState().addPage(0, 0);
  const second = useEditorStore.getState().addPage(300, 0);
  useEditorStore.getState().updatePageTitle(second, 'The Locked Door');
  useEditorStore.getState().addChoice(first);
  const choiceId = useEditorStore.getState().pages[first].choices[0].id;
  useEditorStore.getState().setChoiceDestination(first, choiceId, second);
  useEditorStore.getState().setSelectedPage(second);
  useToastStore.setState({ toast: null });
  return { first, second, choiceId };
};

const page = (id: string): Page => useEditorStore.getState().pages[id];

/*
 * Mirrors the Inspector: the page comes from the store, so an edit comes back as a
 * new prop. Passing a snapshot instead leaves the inputs reading stale values.
 */
const LiveSettings: React.FC<{ pageId: string }> = ({ pageId }) => {
  const stored = useEditorStore((state) => state.pages[pageId]);
  return stored ? <SettingsTab page={stored} /> : null;
};

describe('SettingsTab', () => {
  let ids: ReturnType<typeof seed>;

  beforeEach(() => {
    ids = seed();
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
    useToastStore.setState({ toast: null });
  });

  it('edits what the page is', async () => {
    render(<LiveSettings pageId={ids.second} />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'plot');

    expect(page(ids.second).type).toBe('plot');
  });

  /* The title is content, so it lives in the Write tab. */
  it('does not offer the title — that belongs where the prose is', () => {
    render(<LiveSettings pageId={ids.second} />);

    expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull();
  });

  describe('deleting the page', () => {
    /*
     * Until this existed, the canvas keyboard was the only way to delete a page while
     * every other entity in the app had a visible button.
     */
    it('removes the page and everything pointing at it', async () => {
      render(<SettingsTab page={page(ids.second)} />);
      await userEvent.click(screen.getByRole('button', { name: 'Delete this page' }));

      const state = useEditorStore.getState();
      expect(state.pages[ids.second]).toBeUndefined();
      expect(state.nodes.find((node) => node.id === ids.second)).toBeUndefined();
      expect(page(ids.first).choices[0].targetPageId).toBeUndefined();
    });

    it('drops the selection, so the inspector does not read a hole', async () => {
      render(<SettingsTab page={page(ids.second)} />);
      await userEvent.click(screen.getByRole('button', { name: 'Delete this page' }));

      expect(useEditorStore.getState().selectedPageId).toBeNull();
    });

    /* No confirmation dialog: it is undoable, which is what makes that acceptable. */
    it('names the page it deleted, and offers it back', async () => {
      render(<SettingsTab page={page(ids.second)} />);
      await userEvent.click(screen.getByRole('button', { name: 'Delete this page' }));

      const toast = useToastStore.getState().toast!;
      expect(toast.message).toBe('Deleted “The Locked Door”.');
      expect(toast.action?.label).toBe('Undo');
    });

    it('undo puts the page and its inbound choice back', async () => {
      render(<SettingsTab page={page(ids.second)} />);
      await userEvent.click(screen.getByRole('button', { name: 'Delete this page' }));

      useToastStore.getState().toast!.action!.onClick();

      expect(page(ids.second).title).toBe('The Locked Door');
      expect(page(ids.first).choices[0].targetPageId).toBe(ids.second);
    });

    it('says “Untitled page” rather than nothing when there is no title', async () => {
      useEditorStore.getState().updatePageTitle(ids.second, '');
      render(<SettingsTab page={page(ids.second)} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete this page' }));

      expect(useToastStore.getState().toast!.message).toBe('Deleted “Untitled page”.');
    });
  });
});
