import { describe, it, expect } from 'vitest';
import { summariseStory } from './storySummary';
import { storyMetaLine } from './storyMetaLine';

const NOW = new Date('2026-08-11T12:00:00Z').getTime();

const snapshot = (over: Record<string, unknown> = {}, stateOver: Record<string, unknown> = {}) => ({
  version: 3,
  savedAt: NOW - 3 * 60 * 60 * 1000,
  state: {
    storyTitle: 'The Awakening',
    storyDescription: 'A short demo.',
    startPageId: 'page-1',
    pages: {
      'page-1': {
        id: 'page-1',
        title: 'The Awakening',
        paragraphs: [{ id: 'p1', text: '<p>Words.</p>' }],
        choices: [
          { id: 'c1', text: 'Open the door', targetPageId: 'page-2' },
          { id: 'c2', text: 'Wait', targetPageId: 'page-2' },
        ],
      },
      'page-2': {
        id: 'page-2',
        title: 'The Locked Door',
        paragraphs: [{ id: 'p2', text: '<p>Oak.</p>' }],
        choices: [],
      },
    },
    subplots: [{ id: 'sub-1', name: 'The Cellar' }],
    ...stateOver,
  },
  ...over,
});

describe('summariseStory', () => {
  it('counts what the row shows', () => {
    const summary = summariseStory('abc', snapshot());

    expect(summary).toMatchObject({
      id: 'abc',
      title: 'The Awakening',
      description: 'A short demo.',
      pageCount: 2,
      choiceCount: 2,
      subplotCount: 1,
      problemCount: 0,
    });
  });

  /*
   * The same report the Story health screen reads, so the dashboard's figure and
   * that screen's badge cannot disagree.
   */
  it('takes "things to fix" from the health report', () => {
    const summary = summariseStory(
      'abc',
      snapshot({}, {
        pages: {
          'page-1': {
            id: 'page-1',
            title: 'A',
            paragraphs: [],
            choices: [{ id: 'c1', text: 'go', targetPageId: 'deleted' }],
          },
          orphan: { id: 'orphan', title: 'Orphan', paragraphs: [], choices: [] },
        },
      })
    );

    // One unreachable page, one choice pointing at a page that is not there.
    expect(summary.problemCount).toBe(2);
  });

  it('names an untitled story rather than showing a blank row', () => {
    expect(summariseStory('abc', snapshot({}, { storyTitle: '' })).title).toBe('Untitled story');
  });

  it('leaves the description empty rather than inventing "No description"', () => {
    expect(summariseStory('abc', snapshot({}, { storyDescription: '' })).description).toBe('');
  });

  it('has no timestamp for a story saved before the envelope carried one', () => {
    const { savedAt, ...rest } = snapshot();
    void savedAt;
    expect(summariseStory('abc', rest).savedAt).toBeUndefined();
  });

  it('survives a blob it cannot make sense of', () => {
    expect(summariseStory('abc', undefined)).toMatchObject({ pageCount: 0, choiceCount: 0 });
    expect(summariseStory('abc', { version: 3 })).toMatchObject({ title: 'Untitled story' });
    expect(summariseStory('abc', 'nonsense')).toMatchObject({ pageCount: 0 });
  });
});

describe('storyMetaLine', () => {
  it('reads as the design sets it', () => {
    expect(storyMetaLine(summariseStory('abc', snapshot()), NOW)).toEqual([
      '2 pages',
      '2 choices',
      '1 subplot',
      'nothing to fix',
      'edited 3 hours ago',
    ]);
  });

  it('says how many things need fixing when some do', () => {
    const summary = { ...summariseStory('abc', snapshot()), problemCount: 3 };
    expect(storyMetaLine(summary, NOW)).toContain('3 to fix');
  });

  /* "0 subplots" is noise on a story that never had any. */
  it('leaves subplots out when there are none', () => {
    const summary = { ...summariseStory('abc', snapshot()), subplotCount: 0 };
    expect(storyMetaLine(summary, NOW)).not.toContain('0 subplots');
  });

  it('leaves the timestamp out when there is none', () => {
    const summary = { ...summariseStory('abc', snapshot()), savedAt: undefined };
    expect(storyMetaLine(summary, NOW).some((part) => part.startsWith('edited'))).toBe(false);
  });

  it('says one page, one choice in the singular', () => {
    const summary = { ...summariseStory('abc', snapshot()), pageCount: 1, choiceCount: 1 };
    expect(storyMetaLine(summary, NOW).slice(0, 2)).toEqual(['1 page', '1 choice']);
  });
});
