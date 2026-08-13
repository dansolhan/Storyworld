// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceRenderer } from './ChoiceRenderer';
import { EngineProvider } from '../adapter/EngineProvider';
import { useEngine } from '../adapter/useEngine';
import type { StoryData } from '../../../domain/Story/StoryData';
import { CURRENT_VERSION } from '../../../domain/Story/migrations/migrations';

/* Playing a sound needs APIs jsdom has not got, and none of this is about audio. */
vi.mock('../hooks/useChoiceSound', () => ({ useChoiceSound: () => ({ play: vi.fn() }) }));

const story = (choices: { id: string; text: string }[]): StoryData => ({
  version: CURRENT_VERSION,
  title: 'The Awakening',
  startPageId: 'page-1',
  variables: {},
  pages: [
    {
      id: 'page-1',
      title: 'The Awakening',
      paragraphs: [{ id: 'p1', text: '<p>You wake.</p>' }],
      choices,
    },
  ],
});

/**
 * Boots a real engine, so visibility and choice dispatch behave as they do in play.
 *
 * The renderer is mounted only once the story is loaded, because it reads visible
 * content on its first render and an empty engine looks exactly like an ending.
 */
const Booted: React.FC<{ data: StoryData; onExit?: () => void }> = ({ data, onExit }) => {
  const engine = useEngine();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    engine.dispatch({ type: 'INITIALIZE', payload: { storyData: data } });
    setReady(true);
  }, [engine, data]);

  return ready ? <ChoiceRenderer pageId="page-1" onExit={onExit} /> : null;
};

const renderChoices = (data: StoryData, withExit = true) => {
  const onExit = vi.fn();
  render(
    <EngineProvider>
      <Booted data={data} onExit={withExit ? onExit : undefined} />
    </EngineProvider>
  );
  return onExit;
};

describe('ChoiceRenderer', () => {
  afterEach(cleanup);

  it('numbers the choices, as a gamebook sets them', () => {
    renderChoices(story([
      { id: 'c1', text: 'Inspect the door' },
      { id: 'c2', text: 'Look out the window' },
    ]));

    const rows = screen.getAllByRole('button');
    expect(within(rows[0]).getByText('1')).toBeTruthy();
    expect(within(rows[0]).getByText('Inspect the door')).toBeTruthy();
    expect(within(rows[1]).getByText('2')).toBeTruthy();
  });

  describe('the end of a story', () => {
    /*
     * 6b is emphatic about this: no statistics and no ending counts. The ledger keeps
     * showing what it showed during play, and the page offers only two ways on.
     */
    it('is a colophon — the words and two actions, nothing counted', () => {
      renderChoices(story([]));

      expect(screen.getByText('The End')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Begin again' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Back to the editor' })).toBeTruthy();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('offers to begin again', async () => {
      renderChoices(story([]));
      await userEvent.click(screen.getByRole('button', { name: 'Begin again' }));

      // Restarting re-enters the start page, so the choices come back.
      expect(screen.queryByText('The End')).toBeTruthy();
    });

    it('hands you back to the editor', async () => {
      const onExit = renderChoices(story([]));
      await userEvent.click(screen.getByRole('button', { name: 'Back to the editor' }));

      expect(onExit).toHaveBeenCalled();
    });

    it('shows no way back to the editor when there is nowhere to go', () => {
      renderChoices(story([]), false);

      expect(screen.queryByRole('button', { name: 'Back to the editor' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Begin again' })).toBeTruthy();
    });
  });
});
