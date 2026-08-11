import { describe, it, expect } from 'vitest';
import {
  countByCategory,
  filterRuleOptions,
  previewSentence,
  ruleOptions,
} from './rulePickerOptions';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { BLUEPRINT_CATEGORIES } from '../../../../domain/Blueprints/BlueprintCategory';

const options = ruleOptions();
const sentenceFor = (blueprintId: string): string =>
  options.find((option) => option.blueprintId === blueprintId)!.sentence;

describe('previewSentence', () => {
  it('reads as a sentence rather than a row of ellipses', () => {
    expect(sentenceFor('has_item_count')).toBe('the reader carries at least an item');
    expect(sentenceFor('give_item')).toBe('give the reader an item');
    expect(sentenceFor('remove_item')).toBe('take an item from the reader');
  });

  it('keeps the article the template already supplies', () => {
    expect(sentenceFor('has_item')).toBe('the reader carries the item');
  });

  it('assumes the positive reading of a negatable condition', () => {
    expect(sentenceFor('visited_page')).toBe('the reader has visited a page');
    expect(sentenceFor('first_visit')).toBe('this is the reader’s first visit to this page');
  });

  it('leaves a template with no tokens alone', () => {
    expect(sentenceFor('and_group')).toBe('all of these hold');
    expect(sentenceFor('hide_paragraph')).toBe('hide this paragraph');
  });

  it('falls back to an ellipsis for a token it has no noun for', () => {
    expect(previewSentence('unknown', 'wait for {{somethingNew}}')).toBe('wait for …');
  });

  it('never leaves a raw token in a real blueprint', () => {
    for (const option of options) {
      expect(option.sentence, option.blueprintId).not.toMatch(/\{\{|\}\}/);
    }
  });
});

describe('ruleOptions', () => {
  it('offers every blueprint in both registries', () => {
    const expected =
      Object.keys(conditionalBlueprints).length + Object.keys(actionBlueprints).length;
    expect(options).toHaveLength(expected);
  });

  it('gives every option a category the rail knows about', () => {
    for (const option of options) {
      expect(BLUEPRINT_CATEGORIES, option.blueprintId).toContain(option.category);
    }
  });

  it('marks conditions and actions apart, so the picker can prefix "If"', () => {
    expect(options.find((option) => option.blueprintId === 'has_item')?.kind).toBe('condition');
    expect(options.find((option) => option.blueprintId === 'give_item')?.kind).toBe('action');
  });
});

describe('filterRuleOptions', () => {
  it('returns everything for an empty query', () => {
    expect(filterRuleOptions(options, '  ')).toHaveLength(options.length);
  });

  it('matches the sentence, not only the blueprint name', () => {
    const ids = filterRuleOptions(options, 'carries').map((option) => option.blueprintId);
    expect(ids).toEqual(expect.arrayContaining(['has_item', 'has_item_count']));
  });

  it('matches the blueprint name a returning author would search for', () => {
    expect(filterRuleOptions(options, 'has item').map((option) => option.blueprintId)).toEqual(
      expect.arrayContaining(['has_item', 'has_item_count'])
    );
  });

  it('requires every term, so terms narrow instead of widen', () => {
    const carries = filterRuleOptions(options, 'carries');
    const carriesLeast = filterRuleOptions(options, 'carries least');

    expect(carriesLeast.length).toBeLessThan(carries.length);
    expect(carriesLeast.map((option) => option.blueprintId)).toEqual(['has_item_count']);
  });

  it('finds nothing for a query no rule mentions', () => {
    expect(filterRuleOptions(options, 'teleport')).toEqual([]);
  });
});

describe('countByCategory', () => {
  it('counts what the rail shows beside each category', () => {
    const counts = countByCategory(filterRuleOptions(options, 'item'));
    expect(counts.inventory).toBe(4);
  });

  it('sums to the number of options', () => {
    const counts = countByCategory(options);
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(options.length);
  });
});
