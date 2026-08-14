// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { get, keys, del, set } from 'idb-keyval';
import { Dashboard } from './Dashboard';
import { useEditorStore } from '../editor/store/useEditorStore';

const pristineState = useEditorStore.getState();
const NOW = Date.now();

const storyBlob = (title: string, description: string, savedAt?: number) => ({
  version: 3,
  savedAt,
  state: {
    storyTitle: title,
    storyDescription: description,
    startPageId: 'page-1',
    pages: {
      'page-1': {
        id: 'page-1',
        title: 'Opening',
        paragraphs: [{ id: 'p1', text: '<p>Words.</p>' }],
        choices: [{ id: 'c1', text: 'Onward', targetPageId: 'page-2' }],
      },
      'page-2': {
        id: 'page-2',
        title: 'Ending',
        paragraphs: [{ id: 'p2', text: '<p>Done.</p>' }],
        choices: [],
      },
    },
    subplots: [],
  },
});

/** The shelf as IndexedDB would hand it over. */
const shelf = (entries: Record<string, unknown>) => {
  vi.mocked(keys).mockResolvedValue(Object.keys(entries));
  vi.mocked(get).mockImplementation(async (key) => entries[key as string]);
};

const renderDashboard = () => {
  const props = {
    onOpenStory: vi.fn(),
    onPlayStory: vi.fn(),
    onImportClick: vi.fn(),
  };
  render(<Dashboard {...props} />);
  return props;
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorStore.setState(pristineState, true);
    shelf({});
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  describe('with nothing on the shelf', () => {
    it('invites you to begin, and offers all three ways in', async () => {
      const props = renderDashboard();

      expect(await screen.findByRole('heading', { name: 'Begin a story' })).toBeTruthy();
      expect(screen.getByText('With nothing on the shelf')).toBeTruthy();

      await userEvent.click(screen.getByRole('button', { name: 'Import a file' }));
      expect(props.onImportClick).toHaveBeenCalled();
    });

    it('opens a new story in the editor', async () => {
      const props = renderDashboard();
      await userEvent.click(await screen.findByRole('button', { name: '+ New story' }));

      expect(props.onOpenStory).toHaveBeenCalled();
    });

    it('keeps the header alternatives out of the way until there is a shelf', async () => {
      renderDashboard();
      await screen.findByRole('heading', { name: 'Begin a story' });

      // Exactly one of each, from the panel — not doubled by a header copy.
      expect(screen.getAllByRole('button', { name: 'Load the demo' })).toHaveLength(1);
    });
  });

  describe('with stories', () => {
    beforeEach(() => {
      shelf({
        'story-a': storyBlob('The Awakening', 'A short demo.', NOW - 3 * 60 * 60 * 1000),
        'story-b': storyBlob('Half-Light', '', NOW - 30 * 60 * 1000),
      });
    });

    it('lists each story with its real counts', async () => {
      renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'The Awakening' })).closest('article')!;

      expect(within(row).getByText('A short demo.')).toBeTruthy();
      expect(within(row).getByText('2 pages')).toBeTruthy();
      expect(within(row).getByText('1 choice')).toBeTruthy();
      expect(within(row).getByText('nothing to fix')).toBeTruthy();
      expect(within(row).getByText('edited 3 hours ago')).toBeTruthy();
    });

    it('puts the most recently edited story first', async () => {
      renderDashboard();
      await screen.findByRole('heading', { name: 'Half-Light' });

      const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
      expect(titles).toEqual(['Half-Light', 'The Awakening']);
    });

    it('says so plainly when a story has no description', async () => {
      renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'Half-Light' })).closest('article')!;

      expect(within(row).getByText('No description yet.')).toBeTruthy();
    });

    it('opens a story in the editor', async () => {
      const props = renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'The Awakening' })).closest('article')!;

      await userEvent.click(within(row).getByRole('button', { name: 'Open' }));

      await waitFor(() => expect(props.onOpenStory).toHaveBeenCalled());
      expect(props.onPlayStory).not.toHaveBeenCalled();
    });

    /* Play loads the same way Open does; only what happens next differs. */
    it('loads the story before handing it to the player', async () => {
      const props = renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'The Awakening' })).closest('article')!;

      await userEvent.click(within(row).getByRole('button', { name: 'Play' }));

      await waitFor(() => expect(props.onPlayStory).toHaveBeenCalled());
      expect(useEditorStore.getState().storyTitle).toBe('The Awakening');
      expect(Object.keys(useEditorStore.getState().pages)).toHaveLength(2);
    });

    it('says what deleting a story would cost, and does nothing until confirmed', async () => {
      renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'The Awakening' })).closest('article')!;

      await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));

      expect(screen.getByText(/2 pages and 1 choice/)).toBeTruthy();
      expect(screen.getByText(/no copy to fall back on/)).toBeTruthy();

      await userEvent.click(screen.getByRole('button', { name: 'Keep it' }));
      expect(vi.mocked(del)).not.toHaveBeenCalled();
    });

    it('deletes on confirmation', async () => {
      renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'The Awakening' })).closest('article')!;

      await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(vi.mocked(del)).toHaveBeenCalledWith('story-a'));
    });

    it('offers demo and import as links beside the one thing to do', async () => {
      renderDashboard();
      await screen.findByRole('heading', { name: 'The Awakening' });

      expect(screen.getByRole('button', { name: 'Load the demo' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Import a file' })).toBeTruthy();
      expect(screen.getByRole('button', { name: '+ New story' })).toBeTruthy();
    });
  });

  describe('a story that needs attention', () => {
    it('says how many things need fixing', async () => {
      const broken = storyBlob('Half-Light', '', NOW);
      broken.state.pages['page-1'].choices = [
        { id: 'c1', text: 'Onward', targetPageId: 'no-such-page' },
      ];
      shelf({ 'story-b': broken });

      renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'Half-Light' })).closest('article')!;

      // The dangling target, and page-2 left unreachable by it.
      expect(within(row).getByText('2 to fix')).toBeTruthy();
    });
  });

  describe('a story that was upgraded', () => {
    /*
     * The safety net for the one edit an author never asked for. A schema upgrade
     * rewrites the only saved copy, so it takes a backup first — and the shelf is where
     * you would look when a story comes back looking wrong.
     */
    const upgraded = () => {
      const blob = storyBlob('The Awakening', 'A short demo.', NOW);
      shelf({
        'story-a': blob,
        'story-backup-a': {
          takenAt: NOW - 60 * 60 * 1000,
          fromVersion: '1.2.0',
          toVersion: '1.3.0',
          snapshot: storyBlob('The Awakening', 'Before the upgrade.', NOW - 2 * 60 * 60 * 1000),
        },
      });
    };

    it('says it was upgraded, and from what', async () => {
      upgraded();
      renderDashboard();

      expect(
        await screen.findByRole('button', { name: /Upgraded from version 1\.2\.0/ })
      ).toBeTruthy();
    });

    it('does not list the backup as a story of its own', async () => {
      upgraded();
      renderDashboard();
      await screen.findByRole('heading', { name: 'The Awakening' });

      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    });

    it('offers nothing to revert to on a story that was never upgraded', async () => {
      shelf({ 'story-a': storyBlob('The Awakening', '', NOW) });
      renderDashboard();
      await screen.findByRole('heading', { name: 'The Awakening' });

      expect(screen.queryByRole('button', { name: /Upgraded from/ })).toBeNull();
    });

    /* Unlike a page delete this cannot be undone, so it asks and says what is traded. */
    it('warns that reverting loses everything written since', async () => {
      upgraded();
      renderDashboard();
      await userEvent.click(await screen.findByRole('button', { name: /Upgraded from/ }));

      expect(screen.getByText(/Anything written since then is lost/)).toBeTruthy();

      await userEvent.click(screen.getByRole('button', { name: 'Keep the current version' }));
      expect(vi.mocked(set)).not.toHaveBeenCalled();
    });

    it('puts the pre-upgrade copy back when confirmed', async () => {
      upgraded();
      renderDashboard();
      await userEvent.click(await screen.findByRole('button', { name: /Upgraded from/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Revert' }));

      await waitFor(() =>
        expect(vi.mocked(set)).toHaveBeenCalledWith(
          'story-a',
          expect.objectContaining({
            state: expect.objectContaining({ storyDescription: 'Before the upgrade.' }),
          })
        )
      );
    });

    it('drops the backup with the story', async () => {
      upgraded();
      renderDashboard();
      const row = (await screen.findByRole('heading', { name: 'The Awakening' })).closest('article')!;

      await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(vi.mocked(del)).toHaveBeenCalledWith('story-a'));
      expect(vi.mocked(del)).toHaveBeenCalledWith('story-backup-a');
    });
  });
});
