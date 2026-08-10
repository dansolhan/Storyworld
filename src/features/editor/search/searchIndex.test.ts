import { describe, it, expect } from 'vitest';
import { stripHtml } from './stripHtml';
import { buildSearchIndex } from './buildSearchIndex';
import { matchEntries, matchPosition, queryTerms } from './matchEntries';
import { excerpt } from './excerpt';
import { buildPaletteGroups } from './paletteRows';
import { paletteAction } from './paletteAction';
import type { Page } from '../../../domain/Page/Page';

const pages: Record<string, Page> = {
  'page-1': {
    id: 'page-1',
    title: 'The Forgotten Shrine',
    paragraphs: [
      {
        id: 'para-1',
        text: '<p>The <strong>shrine</strong> is older than the forest around it, {{playerName}}.</p>',
      },
      { id: 'para-2', text: '<p></p>' },
    ],
    choices: [
      { id: 'choice-1', text: 'Examine the shrine' },
      { id: 'choice-2', text: '   ' },
    ],
  },
  'page-2': {
    id: 'page-2',
    title: 'Deep into the Woods',
    paragraphs: [],
    choices: [{ id: 'choice-3', text: 'Walk into the forest' }],
  },
};

describe('stripHtml', () => {
  it('reduces markup to the prose a reader sees', () => {
    expect(stripHtml('<p>A <strong>dimly lit</strong> room.</p>')).toBe('A dimly lit room.');
  });

  it('keeps variable tokens, so a variable name is findable', () => {
    expect(stripHtml('<p>Hello {{playerName}}.</p>')).toContain('{{playerName}}');
  });

  it('keeps a marked phrase but drops the hover text behind it', () => {
    const html =
      '<p>a <span class="contextual-text-mark" data-context="an old shrine">small window</span></p>';
    const text = stripHtml(html);
    expect(text).toBe('a small window');
    expect(text).not.toContain('an old shrine');
  });

  it('decodes entities and collapses whitespace', () => {
    expect(stripHtml('<p>Tom&nbsp;&amp;   Jerry</p>')).toBe('Tom & Jerry');
  });
});

describe('buildSearchIndex', () => {
  const index = buildSearchIndex(pages);

  it('produces a row per page, choice and paragraph', () => {
    expect(index.filter((entry) => entry.kind === 'page')).toHaveLength(2);
    // The blank choice and the empty paragraph are skipped.
    expect(index.filter((entry) => entry.kind === 'choice')).toHaveLength(2);
    expect(index.filter((entry) => entry.kind === 'paragraph')).toHaveLength(1);
  });

  it('says where a paragraph lives, numbered from one', () => {
    const paragraph = index.find((entry) => entry.kind === 'paragraph');
    expect(paragraph?.detail).toBe('The Forgotten Shrine · paragraph 1');
    expect(paragraph?.paragraphId).toBe('para-1');
    expect(paragraph?.pageId).toBe('page-1');
  });

  it('names the page a choice belongs to', () => {
    const choice = index.find((entry) => entry.choiceId === 'choice-1');
    expect(choice?.detail).toBe('The Forgotten Shrine');
  });

  it('stores a lower-cased haystack alongside the display text', () => {
    const page = index.find((entry) => entry.id === 'page:page-1');
    expect(page?.text).toBe('The Forgotten Shrine');
    expect(page?.haystack).toBe('the forgotten shrine');
  });
});

describe('matching', () => {
  const index = buildSearchIndex(pages);

  it('requires every term, in any order or position', () => {
    expect(matchPosition('the forgotten shrine', queryTerms('shrine forgotten'))).toBe(4);
    expect(matchPosition('the forgotten shrine', queryTerms('shrine cellar'))).toBe(-1);
  });

  it('treats an empty query as matching everything', () => {
    expect(matchEntries(index, '')).toHaveLength(index.length);
    expect(matchEntries(index, '   ')).toHaveLength(index.length);
  });

  it('is case-insensitive', () => {
    expect(matchEntries(index, 'SHRINE').length).toBeGreaterThan(0);
  });

  it('finds prose as well as titles', () => {
    const kinds = matchEntries(index, 'older than').map((match) => match.entry.kind);
    expect(kinds).toEqual(['paragraph']);
  });

  it('finds a paragraph by the variable it prints', () => {
    expect(matchEntries(index, 'playerName')).toHaveLength(1);
  });

  it('ranks pages, then choices, then prose', () => {
    const kinds = matchEntries(index, 'shrine').map((match) => match.entry.kind);
    expect(kinds).toEqual(['page', 'choice', 'paragraph']);
  });

  it('puts an earlier match first within a group', () => {
    const withPrefix: Record<string, Page> = {
      a: { id: 'a', title: 'Woods at dusk', paragraphs: [], choices: [] },
      b: { id: 'b', title: 'Deep into the Woods', paragraphs: [], choices: [] },
    };
    const titles = matchEntries(buildSearchIndex(withPrefix), 'woods').map((m) => m.entry.text);
    expect(titles).toEqual(['Woods at dusk', 'Deep into the Woods']);
  });
});

describe('excerpt', () => {
  it('leaves short prose alone', () => {
    expect(excerpt('A short line.', 2)).toBe('A short line.');
  });

  it('windows long prose around the match and marks what was dropped', () => {
    const text = `${'a'.repeat(200)} shrine ${'b'.repeat(200)}`;
    const result = excerpt(text, text.indexOf('shrine'));
    expect(result).toContain('shrine');
    expect(result.startsWith('…')).toBe(true);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThan(text.length);
  });

  it('starts and ends on whole words', () => {
    const text =
      'As you arrive at an ancient stone shrine heavily covered in moss, the forest falls quiet and the birds stop singing overhead somewhere far away.';
    const result = excerpt(text, text.indexOf('shrine'));

    const body = result.replace(/^…|…$/g, '');
    expect(text).toContain(body);
    // Would have been "…ou arrive at" if the window ignored word boundaries.
    expect(body.startsWith('ou ')).toBe(false);
    expect(result).toContain('shrine');
  });
});

describe('buildPaletteGroups', () => {
  const index = buildSearchIndex(pages);

  it('orders groups pages, choices, in text, then actions', () => {
    const groups = buildPaletteGroups(matchEntries(index, 'shrine'), [
      paletteAction('a', 'New page “shrine”', () => {}),
    ]);
    expect(groups.map((group) => group.heading)).toEqual(['Pages', 'Choices', 'In text', 'Actions']);
  });

  it('omits groups that matched nothing', () => {
    const groups = buildPaletteGroups(matchEntries(index, 'older than'), []);
    expect(groups.map((group) => group.heading)).toEqual(['In text']);
  });

  it('caps a group and reports the total it capped', () => {
    const many: Record<string, Page> = {};
    for (let i = 0; i < 12; i++) {
      many[`p${i}`] = { id: `p${i}`, title: `Page ${i}`, paragraphs: [], choices: [] };
    }
    const [group] = buildPaletteGroups(matchEntries(buildSearchIndex(many), 'page'), []);
    expect(group.rows).toHaveLength(8);
    expect(group.total).toBe(12);
  });
});
