import { describe, it, expect, beforeEach } from 'vitest';
import { StoryEngine } from './StoryEngine';
import type { StoryData } from '../../domain/Story/StoryData';
import type { DebugSnapshot } from '../../domain/Story/DebugSnapshot';

/** A page whose `onEnter` sets `hp` to 100, so re-entry is observable. */
const healingPage = {
  id: 'page-2',
  title: 'The spring',
  paragraphs: [],
  choices: [],
  events: [
    {
      id: 'e1',
      name: 'onEnter',
      logicTree: [
        {
          id: 'n1',
          type: 'action' as const,
          name: 'Set Variable',
          blueprintId: 'set_variable',
          params: { variableKey: 'hp', value: '100' },
        },
      ],
    },
  ],
};

const story = (): StoryData => ({
  version: '1.3.0',
  startPageId: 'page-1',
  pages: [
    { id: 'page-1', title: 'The gate', paragraphs: [], choices: [] },
    healingPage,
    { id: 'page-3', title: 'The well', paragraphs: [], choices: [] },
  ],
  variables: {
    hp: { type: 'number', value: 100, tags: ['combat'] },
    cursed: { type: 'boolean', value: false },
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
});

const snapshot: DebugSnapshot = {
  id: 's1',
  name: 'Late game',
  createdAt: 0,
  variables: { hp: { type: 'number', value: 12 }, cursed: { type: 'boolean', value: true } },
  inventory: { coin: 3 },
  visitedPageIds: ['page-1', 'page-3'],
};

describe('StoryEngine debug messages', () => {
  let engine: StoryEngine;

  beforeEach(() => {
    engine = new StoryEngine();
    engine.dispatch({ type: 'INITIALIZE', payload: { storyData: story() } });
  });

  it('sets a variable through the same coercion an action would use', () => {
    engine.dispatch({ type: 'DEBUG_SET_VARIABLE', payload: { key: 'hp', value: '55' } });

    // Declared as a number, so a typed string lands as one — and the tags survive.
    expect(engine.store.getState().variables.hp).toEqual({
      type: 'number',
      value: 55,
      tags: ['combat'],
    });
  });

  it('gives and takes inventory, clearing the entry at zero', () => {
    engine.dispatch({ type: 'DEBUG_SET_INVENTORY', payload: { itemId: 'coin', count: 2 } });
    expect(engine.store.getState().inventory).toEqual({ coin: 2 });

    engine.dispatch({ type: 'DEBUG_SET_INVENTORY', payload: { itemId: 'coin', count: 0 } });
    expect(engine.store.getState().inventory).toEqual({});
  });

  it('marks a page visited and un-visits it again', () => {
    engine.dispatch({ type: 'DEBUG_SET_VISITED', payload: { pageId: 'page-3', visited: true } });
    expect(engine.store.getState().visitedPageIds).toContain('page-3');

    engine.dispatch({ type: 'DEBUG_SET_VISITED', payload: { pageId: 'page-3', visited: false } });
    expect(engine.store.getState().visitedPageIds).not.toContain('page-3');
  });

  it('does not record the same visit twice', () => {
    engine.dispatch({ type: 'DEBUG_SET_VISITED', payload: { pageId: 'page-3', visited: true } });
    engine.dispatch({ type: 'DEBUG_SET_VISITED', payload: { pageId: 'page-3', visited: true } });

    expect(engine.store.getState().visitedPageIds.filter((id) => id === 'page-3')).toHaveLength(1);
  });

  describe('applying a snapshot', () => {
    it('restores variables, inventory and visited pages', () => {
      engine.dispatch({ type: 'DEBUG_APPLY_SNAPSHOT', payload: { snapshot } });
      const state = engine.store.getState();

      expect(state.variables.hp.value).toBe(12);
      expect(state.variables.cursed.value).toBe(true);
      expect(state.inventory).toEqual({ coin: 3 });
      expect(state.visitedPageIds).toEqual(['page-1', 'page-3']);
    });

    it('leaves the reader standing where they were', () => {
      engine.dispatch({ type: 'DEBUG_GO_TO_PAGE', payload: { pageId: 'page-3' } });
      engine.dispatch({ type: 'DEBUG_APPLY_SNAPSHOT', payload: { snapshot } });

      expect(engine.store.getState().currentPageId).toBe('page-3');
    });

    /*
     * The footgun this guards: routing a snapshot load through `enterPage` would
     * run the page's `onEnter` against the state just loaded and overwrite it —
     * the author would watch their restored variables revert on arrival.
     */
    it("does not re-run the current page's onEnter events", () => {
      engine.dispatch({ type: 'DEBUG_GO_TO_PAGE', payload: { pageId: 'page-2' } });
      expect(engine.store.getState().variables.hp.value).toBe(100);

      engine.dispatch({ type: 'DEBUG_APPLY_SNAPSHOT', payload: { snapshot } });

      expect(engine.store.getState().variables.hp.value).toBe(12);
    });

    it('clears transient messages rather than restoring a page you are not on', () => {
      engine.store.setState({
        messages: [{ id: 'm1', text: 'A bell rings', pageId: 'page-1' }],
        choiceOverrides: { 'c1': { text: 'Changed' } },
      });

      engine.dispatch({ type: 'DEBUG_APPLY_SNAPSHOT', payload: { snapshot } });

      expect(engine.store.getState().messages).toEqual([]);
      expect(engine.store.getState().choiceOverrides).toEqual({});
    });
  });

  it('re-enters the current page on request, which is the way to run onEnter again', () => {
    engine.dispatch({ type: 'DEBUG_GO_TO_PAGE', payload: { pageId: 'page-2' } });
    engine.dispatch({ type: 'DEBUG_SET_VARIABLE', payload: { key: 'hp', value: 3 } });
    expect(engine.store.getState().variables.hp.value).toBe(3);

    engine.dispatch({ type: 'DEBUG_REENTER_PAGE' });

    expect(engine.store.getState().variables.hp.value).toBe(100);
  });

  it('moves to a page without taking a choice, and records the visit', () => {
    engine.dispatch({ type: 'DEBUG_GO_TO_PAGE', payload: { pageId: 'page-3' } });
    const state = engine.store.getState();

    expect(state.currentPageId).toBe('page-3');
    expect(state.visitedPageIds).toContain('page-3');
  });
});
