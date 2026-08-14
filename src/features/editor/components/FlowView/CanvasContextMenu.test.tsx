// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasContextMenu, type CanvasMenuTarget } from './CanvasContextMenu';
import { useEditorStore } from '../../store/useEditorStore';
import { useToastStore } from '../../../../components/ui/Toast/useToastStore';

const pristineState = useEditorStore.getState();

const seed = () => {
  useEditorStore.setState(pristineState, true);
  const pageId = useEditorStore.getState().addPage(0, 0);
  useEditorStore.getState().updatePageTitle(pageId, 'The Locked Door');
  useEditorStore.getState().addSubplot('The Hidden Cellar', 'Below the room');
  useToastStore.setState({ toast: null });
  return { pageId, subplotId: useEditorStore.getState().subplots[0].id };
};

const openOn = (target: CanvasMenuTarget) => {
  const onPlayFromPage = vi.fn();
  render(
    <CanvasContextMenu
      x={100}
      y={100}
      target={target}
      onClose={vi.fn()}
      onPlayFromPage={onPlayFromPage}
    />
  );
  return onPlayFromPage;
};

describe('CanvasContextMenu', () => {
  let ids: ReturnType<typeof seed>;

  beforeEach(() => {
    ids = seed();
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
    useToastStore.setState({ toast: null });
  });

  describe('on a page', () => {
    it('offers what you would otherwise leave the canvas for', () => {
      openOn({ kind: 'node', pageId: ids.pageId });

      expect(screen.getByRole('menuitem', { name: 'Play from here' })).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: 'Start the story here' })).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: 'Duplicate this page' })).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: 'Delete this page' })).toBeTruthy();
    });

    it('plays from the page it was opened on', async () => {
      const onPlayFromPage = openOn({ kind: 'node', pageId: ids.pageId });
      await userEvent.click(screen.getByRole('menuitem', { name: 'Play from here' }));

      expect(onPlayFromPage).toHaveBeenCalledWith(ids.pageId);
    });

    it('sets the start page, and offers to unset it once it is', async () => {
      openOn({ kind: 'node', pageId: ids.pageId });
      await userEvent.click(screen.getByRole('menuitem', { name: 'Start the story here' }));

      expect(useEditorStore.getState().startPageId).toBe(ids.pageId);

      cleanup();
      openOn({ kind: 'node', pageId: ids.pageId });
      expect(screen.getByRole('menuitem', { name: 'No longer the start' })).toBeTruthy();
    });

    it('duplicates the page', async () => {
      openOn({ kind: 'node', pageId: ids.pageId });
      await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate this page' }));

      expect(Object.keys(useEditorStore.getState().pages)).toHaveLength(2);
    });

    /* Undoable, like every other route to deleting a page. */
    it('deletes the page and offers it back', async () => {
      openOn({ kind: 'node', pageId: ids.pageId });
      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete this page' }));

      expect(useEditorStore.getState().pages[ids.pageId]).toBeUndefined();
      expect(useToastStore.getState().toast?.message).toBe('Deleted “The Locked Door”.');
    });

    describe('moving between plots', () => {
      it('lists the main plot and every subplot', async () => {
        openOn({ kind: 'node', pageId: ids.pageId });
        await userEvent.click(screen.getByRole('menuitem', { name: /Move to plot/ }));

        expect(screen.getByRole('menuitem', { name: 'The Hidden Cellar' })).toBeTruthy();
        expect(screen.getByRole('menuitem', { name: 'Main Plot' })).toBeTruthy();
      });

      it('moves the page', async () => {
        openOn({ kind: 'node', pageId: ids.pageId });
        await userEvent.click(screen.getByRole('menuitem', { name: /Move to plot/ }));
        await userEvent.click(screen.getByRole('menuitem', { name: 'The Hidden Cellar' }));

        expect(useEditorStore.getState().pages[ids.pageId].subplotId).toBe(ids.subplotId);
      });

      /* Nothing to do, so it does not pretend otherwise. */
      it('disables the plot the page is already in', async () => {
        openOn({ kind: 'node', pageId: ids.pageId });
        await userEvent.click(screen.getByRole('menuitem', { name: /Move to plot/ }));

        /* Plain DOM: this repo does not install jest-dom's matchers. */
        expect(
          screen.getByRole('menuitem', { name: 'Main Plot' }).getAttribute('aria-disabled')
        ).toBe('true');
      });
    });
  });

  describe('on the empty canvas', () => {
    it('adds a page where the cursor was, not where the toolbar would put it', async () => {
      openOn({ kind: 'pane', flowPosition: { x: 420, y: 260 } });
      await userEvent.click(screen.getByRole('menuitem', { name: 'Add a page here' }));

      const added = useEditorStore
        .getState()
        .nodes.find((node) => node.id !== ids.pageId && node.type === 'pageNode');
      expect(added?.position).toEqual({ x: 420, y: 260 });
    });

    it('offers nothing that needs a page', () => {
      openOn({ kind: 'pane', flowPosition: { x: 0, y: 0 } });

      expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    });
  });
});
