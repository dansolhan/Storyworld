import { describe, it, expect } from 'vitest';
import {
  contextIdsIn,
  marksIn,
  renderContextualMark,
  stripUnresolvedMarks,
} from './contextualMark';

const mark = (id: string, inner = 'small window') => renderContextualMark(id, inner);

describe('contextIdsIn', () => {
  it('finds nothing in plain prose', () => {
    expect(contextIdsIn('<p>The door is oak.</p>')).toEqual([]);
  });

  it('reads every id, in the order they appear', () => {
    expect(contextIdsIn(`<p>${mark('a')} and ${mark('b')}</p>`)).toEqual(['a', 'b']);
  });

  it('counts a repeated id twice, because it is marked twice', () => {
    expect(contextIdsIn(`<p>${mark('a')} then ${mark('a')}</p>`)).toEqual(['a', 'a']);
  });

  it('ignores a span that carries no entry id', () => {
    expect(contextIdsIn('<p><span class="something">x</span></p>')).toEqual([]);
  });
});

describe('marksIn', () => {
  it('keeps the marked words, with any markup inside them', () => {
    expect(marksIn(`<p>${mark('a', 'a <em>small</em> window')}</p>`)).toEqual([
      { entryId: 'a', inner: 'a <em>small</em> window' },
    ]);
  });
});

describe('stripUnresolvedMarks', () => {
  const exists = (id: string) => id === 'known';

  it('leaves a resolved mark exactly as it was', () => {
    const html = `<p>a ${mark('known')} above</p>`;
    expect(stripUnresolvedMarks(html, exists)).toBe(html);
  });

  /*
   * The words stay in the sentence: a reader should never meet a phrase that looks
   * clickable and does nothing.
   */
  it('replaces an unresolved mark with the words it wrapped', () => {
    expect(stripUnresolvedMarks(`<p>a ${mark('gone')} above</p>`, exists)).toBe(
      '<p>a small window above</p>'
    );
  });

  it('keeps markup that was inside the unresolved mark', () => {
    expect(
      stripUnresolvedMarks(`<p>${mark('gone', 'a <em>small</em> window')}</p>`, exists)
    ).toBe('<p>a <em>small</em> window</p>');
  });

  it('strips only the unresolved ones', () => {
    const html = `<p>${mark('known', 'one')} and ${mark('gone', 'two')}</p>`;
    const result = stripUnresolvedMarks(html, exists);

    expect(result).toContain('data-context-id="known"');
    expect(result).not.toContain('data-context-id="gone"');
    expect(result).toContain('and two<');
  });

  it('leaves prose with no marks untouched', () => {
    expect(stripUnresolvedMarks('<p>plain</p>', exists)).toBe('<p>plain</p>');
  });
});
