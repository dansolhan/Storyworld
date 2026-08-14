// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerDebugConsole } from './PlayerDebugConsole';
import { EngineProvider } from '../../adapter/EngineProvider';
import { useEngine } from '../../adapter/useEngine';
import type { StoryEngine } from '../../../../lib/engine/StoryEngine';
import type { StoryData } from '../../../../domain/Story/StoryData';
import type { DebugSnapshot } from '../../../../domain/Story/DebugSnapshot';
import { CURRENT_VERSION } from '../../../../domain/Story/migrations/migrations';

const story: StoryData = {
  version: CURRENT_VERSION,
  startPageId: 'page-1',
  variables: {
    hp: { type: 'number', value: 100 },
    cursed: { type: 'boolean', value: false },
    name: { type: 'string', value: 'Wren' },
  },
  items: {
    coin: {
      id: 'coin',
      name: 'River Coin',
      description: 'Worn thin.',
      tags: [],
      multiple: true,
      contextChoices: [],
    },
  },
  pages: [
    { id: 'page-1', title: 'The gate', paragraphs: [], choices: [] },
    { id: 'page-2', title: 'The well', paragraphs: [], choices: [] },
  ],
};

interface Harness {
  engine: StoryEngine;
  bridge: {
    snapshots: DebugSnapshot[];
    onSaveSnapshot: ReturnType<typeof vi.fn>;
    onRenameSnapshot: ReturnType<typeof vi.fn>;
    onDeleteSnapshot: ReturnType<typeof vi.fn>;
  };
}

/** Boots a real engine so the console reads and writes the state it would in play. */
const renderConsole = (snapshots: DebugSnapshot[] = []): Harness => {
  const bridge = {
    snapshots,
    onSaveSnapshot: vi.fn(),
    onRenameSnapshot: vi.fn(),
    onDeleteSnapshot: vi.fn(),
  };
  const captured: { engine?: StoryEngine } = {};

  const Booted: React.FC = () => {
    const engine = useEngine();
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
      captured.engine = engine;
      engine.dispatch({ type: 'INITIALIZE', payload: { storyData: story } });
      setReady(true);
    }, [engine]);

    return ready ? <PlayerDebugConsole {...bridge} /> : null;
  };

  render(
    <EngineProvider>
      <Booted />
    </EngineProvider>
  );

  return { engine: captured.engine as StoryEngine, bridge };
};

const open = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Open the debug console' }));

describe('PlayerDebugConsole', () => {
  afterEach(cleanup);

  it('stays out of the way until asked for', async () => {
    const user = userEvent.setup();
    renderConsole();

    /* Plain DOM: this repo does not install jest-dom's matchers. */
    expect(screen.queryByRole('tab', { name: 'Vars' })).toBeNull();

    await open(user);
    expect(screen.queryByRole('tab', { name: 'Vars' })).not.toBeNull();
  });

  it('gives each variable the control its declared type calls for', async () => {
    const user = userEvent.setup();
    renderConsole();
    await open(user);

    expect(screen.queryByRole('textbox', { name: 'name' })).not.toBeNull();
    expect(screen.queryByRole('spinbutton', { name: 'hp' })).not.toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'cursed' })).not.toBeNull();
  });

  it('writes an edited variable into the engine', async () => {
    const user = userEvent.setup();
    const { engine } = renderConsole();
    await open(user);

    await user.click(screen.getByRole('checkbox', { name: 'cursed' }));

    expect(engine.store.getState().variables.cursed.value).toBe(true);
  });

  it('gives an item to the reader from the items tab', async () => {
    const user = userEvent.setup();
    const { engine } = renderConsole();
    await open(user);
    await user.click(screen.getByRole('tab', { name: 'Items' }));

    await user.click(screen.getByRole('button', { name: 'Add one River Coin' }));

    expect(engine.store.getState().inventory).toEqual({ coin: 1 });
  });

  it('moves the reader to another page without a choice being taken', async () => {
    const user = userEvent.setup();
    const { engine } = renderConsole();
    await open(user);
    await user.click(screen.getByRole('tab', { name: 'Pages' }));

    await user.click(screen.getByRole('button', { name: 'Go to The well' }));

    expect(engine.store.getState().currentPageId).toBe('page-2');
  });

  it('marks a page visited, which is a condition source in its own right', async () => {
    const user = userEvent.setup();
    const { engine } = renderConsole();
    await open(user);
    await user.click(screen.getByRole('tab', { name: 'Pages' }));

    await user.click(screen.getByRole('checkbox', { name: 'Visited The well' }));

    expect(engine.store.getState().visitedPageIds).toContain('page-2');
  });

  it('hands a named snapshot of the live state to the editor', async () => {
    const user = userEvent.setup();
    const { engine, bridge } = renderConsole();
    await open(user);

    engine.dispatch({ type: 'DEBUG_SET_VARIABLE', payload: { key: 'hp', value: 12 } });
    await user.click(screen.getByRole('tab', { name: 'States' }));
    await user.type(screen.getByPlaceholderText('Name this state'), 'Late game');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(bridge.onSaveSnapshot).toHaveBeenCalledTimes(1);
    const saved = bridge.onSaveSnapshot.mock.calls[0][0] as DebugSnapshot;
    expect(saved.name).toBe('Late game');
    expect(saved.variables.hp.value).toBe(12);
    // Position is chosen in the editor, so it is deliberately not in here.
    expect(saved).not.toHaveProperty('currentPageId');
  });

  it('loads a snapshot back into the engine', async () => {
    const user = userEvent.setup();
    const snapshot: DebugSnapshot = {
      id: 's1',
      name: 'Late game',
      createdAt: 0,
      variables: { hp: { type: 'number', value: 12 } },
      inventory: { coin: 2 },
      visitedPageIds: ['page-2'],
    };
    const { engine } = renderConsole([snapshot]);
    await open(user);
    await user.click(screen.getByRole('tab', { name: 'States' }));

    await user.click(screen.getByRole('button', { name: 'Load Late game' }));

    const state = engine.store.getState();
    expect(state.variables.hp.value).toBe(12);
    expect(state.inventory).toEqual({ coin: 2 });
    expect(state.visitedPageIds).toContain('page-2');
  });

  it('says what a stale snapshot could not restore', async () => {
    const user = userEvent.setup();
    const snapshot: DebugSnapshot = {
      id: 's1',
      name: 'Old build',
      createdAt: 0,
      variables: { luck: { type: 'number', value: 3 } },
      inventory: {},
      visitedPageIds: ['page-deleted'],
    };
    renderConsole([snapshot]);
    await open(user);
    await user.click(screen.getByRole('tab', { name: 'States' }));

    await user.click(screen.getByRole('button', { name: 'Load Old build' }));

    expect(screen.queryByText(/skipped 1 variable\(s\), 1 visited page\(s\)/)).not.toBeNull();
  });
});
