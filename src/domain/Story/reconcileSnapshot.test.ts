import { describe, it, expect } from 'vitest';
import { captureSnapshot, reconcileSnapshot } from './reconcileSnapshot';
import type { DebugSnapshot } from './DebugSnapshot';
import type { StoryData } from './StoryData';

const story = (): StoryData => ({
  version: '1.3.0',
  pages: [
    { id: 'page-1', title: 'The gate', paragraphs: [], choices: [] },
    { id: 'page-2', title: 'The well', paragraphs: [], choices: [] },
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

const snapshot = (overrides: Partial<DebugSnapshot> = {}): DebugSnapshot => ({
  id: 's1',
  name: 'Late game',
  createdAt: 0,
  variables: { hp: { type: 'number', value: 12 }, cursed: { type: 'boolean', value: true } },
  inventory: { coin: 3 },
  visitedPageIds: ['page-1'],
  ...overrides,
});

describe('reconcileSnapshot', () => {
  it('restores variables, inventory and where the reader has been', () => {
    const result = reconcileSnapshot(snapshot(), story());

    expect(result.variables.hp.value).toBe(12);
    expect(result.variables.cursed.value).toBe(true);
    expect(result.inventory).toEqual({ coin: 3 });
    expect(result.visitedPageIds).toEqual(['page-1']);
  });

  it("keeps the story's declared type and tags rather than the snapshot's copy", () => {
    const stale = snapshot({ variables: { hp: { type: 'string', value: '12' } } });
    const result = reconcileSnapshot(stale, story());

    expect(result.variables.hp).toEqual({ type: 'number', value: 12, tags: ['combat'] });
  });

  /*
   * Snapshots are taken mid-authoring, so the next hour's work renames a variable
   * or deletes a page. Failing hard would make every snapshot a one-session thing.
   */
  it('skips what the story no longer defines, and says what it skipped', () => {
    const stale = snapshot({
      variables: { hp: { type: 'number', value: 12 }, luck: { type: 'number', value: 3 } },
      inventory: { coin: 1, lantern: 1 },
      visitedPageIds: ['page-1', 'page-99'],
    });

    const result = reconcileSnapshot(stale, story());

    expect(result.variables.luck).toBeUndefined();
    expect(result.inventory).toEqual({ coin: 1 });
    expect(result.visitedPageIds).toEqual(['page-1']);
    expect(result.dropped).toEqual({ variables: ['luck'], items: ['lantern'], pages: ['page-99'] });
  });

  /*
   * A variable added after the snapshot was taken has to arrive at its authored
   * default. Missing entirely, it reads as nothing in every condition — silently
   * gating the content the author had just written.
   */
  it('gives a newly declared variable its authored default', () => {
    const older = snapshot({ variables: { hp: { type: 'number', value: 12 } } });
    const result = reconcileSnapshot(older, story());

    expect(result.variables.cursed).toEqual({ type: 'boolean', value: false });
  });

  it('drops an item the snapshot held none of', () => {
    const result = reconcileSnapshot(snapshot({ inventory: { coin: 0 } }), story());
    expect(result.inventory).toEqual({});
  });
});

describe('captureSnapshot', () => {
  it('freezes state by value, so later play does not rewrite the saved copy', () => {
    const variables = { hp: { type: 'number' as const, value: 100 } };
    const state = { variables, inventory: { coin: 1 }, visitedPageIds: ['page-1'] };

    const taken = captureSnapshot('Start', state);
    variables.hp.value = 3;
    state.inventory.coin = 9;
    state.visitedPageIds.push('page-2');

    expect(taken.variables.hp.value).toBe(100);
    expect(taken.inventory).toEqual({ coin: 1 });
    expect(taken.visitedPageIds).toEqual(['page-1']);
  });

  it('carries no position — where you stand is chosen in the editor', () => {
    const taken = captureSnapshot('Start', { variables: {}, inventory: {}, visitedPageIds: [] });
    expect(taken).not.toHaveProperty('currentPageId');
  });
});
