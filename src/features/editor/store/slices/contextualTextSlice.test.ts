import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';
import { renderContextualMark } from '../../../../domain/ContextualText/contextualMark';
import type { Page } from '../../../../domain/Page/Page';

const pristineState = useEditorStore.getState();

const page = (id: string, paragraphs: Page['paragraphs']): Page => ({
  id,
  title: id,
  paragraphs,
  choices: [],
});

const seed = () => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    contextualText: {
      a: { id: 'a', phrase: 'small window', text: 'Looks onto an old shrine.' },
      b: { id: 'b', phrase: 'the window', text: 'Looks onto an old shrine.' },
      c: { id: 'c', phrase: 'the door', text: 'Solid oak.' },
    },
    pages: {
      'page-1': page('page-1', [
        { id: 'p1', text: `<p>a ${renderContextualMark('a', 'small window')} above</p>` },
      ]),
      'page-2': page('page-2', [
        { id: 'p2', text: `<p>${renderContextualMark('b', 'the window')}</p>` },
        { id: 'p3', text: `<p>${renderContextualMark('c', 'the door')}</p>` },
      ]),
    },
  });
};

const paragraph = (pageId: string, index: number): string =>
  useEditorStore.getState().pages[pageId].paragraphs[index].text;

const entries = () => useEditorStore.getState().contextualText;

describe('contextualTextSlice', () => {
  beforeEach(seed);

  describe('editing', () => {
    it('changes the entry, so every mark on it changes with it', () => {
      useEditorStore.getState().updateContextualEntry('a', { text: 'A shrine, half buried.' });

      expect(entries().a.text).toBe('A shrine, half buried.');
      // The prose is untouched: it never held a copy.
      expect(paragraph('page-1', 0)).toContain('data-context-id="a"');
    });

    it('ignores an entry that is not there', () => {
      const before = entries();
      useEditorStore.getState().updateContextualEntry('nope', { text: 'x' });
      expect(entries()).toBe(before);
    });
  });

  describe('deleting', () => {
    /*
     * Deliberately not a cascade into the prose: rewriting an author's paragraphs as
     * a side effect of a delete is too much to do quietly. The player renders the
     * words as plain prose and Story Health names them.
     */
    it('removes the entry and leaves the marks alone', () => {
      useEditorStore.getState().removeContextualEntry('a');

      expect(entries().a).toBeUndefined();
      expect(paragraph('page-1', 0)).toContain('data-context-id="a"');
    });
  });

  describe('merging', () => {
    it('repoints every mark and drops the merged-away entry', () => {
      useEditorStore.getState().mergeContextualEntries(['a', 'b'], 'a');

      expect(Object.keys(entries()).sort()).toEqual(['a', 'c']);
      expect(paragraph('page-2', 0)).toContain('data-context-id="a"');
      expect(paragraph('page-2', 0)).not.toContain('data-context-id="b"');
    });

    it('keeps the marked words when repointing', () => {
      useEditorStore.getState().mergeContextualEntries(['a', 'b'], 'a');
      expect(paragraph('page-2', 0)).toContain('>the window</span>');
    });

    it('leaves paragraphs that mention neither entry untouched', () => {
      const before = paragraph('page-2', 1);
      useEditorStore.getState().mergeContextualEntries(['a', 'b'], 'a');
      expect(paragraph('page-2', 1)).toBe(before);
    });

    it('does nothing when the target does not exist', () => {
      const before = entries();
      useEditorStore.getState().mergeContextualEntries(['a'], 'nope');
      expect(entries()).toBe(before);
    });

    it('does nothing when there is nothing to merge but the target', () => {
      const before = entries();
      useEditorStore.getState().mergeContextualEntries(['a'], 'a');
      expect(entries()).toBe(before);
    });

    it('merges three at once', () => {
      useEditorStore.getState().mergeContextualEntries(['a', 'b', 'c'], 'c');

      expect(Object.keys(entries())).toEqual(['c']);
      expect(paragraph('page-1', 0)).toContain('data-context-id="c"');
      expect(paragraph('page-2', 0)).toContain('data-context-id="c"');
    });
  });

  describe('adding', () => {
    it('returns the id it stored under', () => {
      const id = useEditorStore
        .getState()
        .addContextualEntry({ id: 'd', phrase: 'the stair', text: 'Down into cold air.' });

      expect(id).toBe('d');
      expect(entries().d.phrase).toBe('the stair');
    });
  });
});
