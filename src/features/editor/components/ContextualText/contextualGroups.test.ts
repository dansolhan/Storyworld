import { describe, it, expect } from 'vitest';
import { groupContextualEntries } from './contextualGroups';
import type { ContextualEntries } from '../../../../domain/ContextualText/ContextualEntry';

const ENTRIES: ContextualEntries = {
  a: { id: 'a', phrase: 'small window', text: 'Looks onto an old shrine.' },
  b: { id: 'b', phrase: 'the window', text: 'Looks onto an old shrine.' },
  c: { id: 'c', phrase: 'iron bands', text: 'Rusted, but thick.' },
  d: { id: 'd', phrase: 'a stair', text: '' },
};

const TITLES = { 'page-1': 'The Awakening', 'page-2': 'The Locked Door' };

const group = (
  pageIds: Record<string, string[]>,
  markCounts: Record<string, number>
) => groupContextualEntries(ENTRIES, pageIds, markCounts, TITLES);

describe('groupContextualEntries', () => {
  it('sorts rows by phrase, so the list reads the same twice running', () => {
    const groups = group({}, {});
    expect(groups.unused.map((row) => row.entry.phrase)).toEqual([
      'a stair',
      'iron bands',
      'small window',
      'the window',
    ]);
  });

  it('calls an entry marked on two pages reused', () => {
    const groups = group({ a: ['page-1', 'page-2'] }, { a: 2 });
    expect(groups.reused.map((row) => row.entry.id)).toEqual(['a']);
  });

  /*
   * The distinction that matters: two phrases in one paragraph pointing at the same
   * entry is reuse. Grouping by page count called that "used once", which was a lie
   * — editing it changes two places.
   */
  it('calls an entry marked twice on one page reused, not used once', () => {
    const groups = group({ a: ['page-1'] }, { a: 2 });

    expect(groups.reused.map((row) => row.entry.id)).toEqual(['a']);
    expect(groups.usedOnce.map((row) => row.entry.id)).not.toContain('a');
  });

  it('reports the page it is on, even when marked there twice', () => {
    const [row] = group({ a: ['page-1'] }, { a: 2 }).reused;

    expect(row.pageTitles).toEqual(['The Awakening']);
    expect(row.markCount).toBe(2);
  });

  it('separates used once from not marked at all', () => {
    const groups = group({ c: ['page-2'] }, { c: 1 });

    expect(groups.usedOnce.map((row) => row.entry.id)).toEqual(['c']);
    // Sorted by phrase: "a stair", "small window", "the window".
    expect(groups.unused.map((row) => row.entry.id)).toEqual(['d', 'a', 'b']);
  });

  it('falls back to the page id when a title has gone', () => {
    const [row] = group({ c: ['page-9'] }, { c: 1 }).usedOnce;
    expect(row.pageTitles).toEqual(['page-9']);
  });

  describe('duplicates', () => {
    it('offers to join entries that say exactly the same thing', () => {
      const groups = group({}, {});
      expect(groups.duplicates).toHaveLength(1);
      expect(groups.duplicates[0].entries.map((entry) => entry.id)).toEqual(['a', 'b']);
    });

    it('does not treat two empty entries as duplicates of each other', () => {
      const groups = groupContextualEntries(
        {
          x: { id: 'x', phrase: 'one', text: '' },
          y: { id: 'y', phrase: 'two', text: '  ' },
        },
        {},
        {},
        TITLES
      );

      expect(groups.duplicates).toEqual([]);
    });

    it('finds nothing to join when every entry is distinct', () => {
      const groups = groupContextualEntries(
        {
          x: { id: 'x', phrase: 'one', text: 'First.' },
          y: { id: 'y', phrase: 'two', text: 'Second.' },
        },
        {},
        {},
        TITLES
      );

      expect(groups.duplicates).toEqual([]);
    });
  });
});
