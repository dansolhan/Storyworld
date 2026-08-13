import { describe, it, expect } from 'vitest';
import { conditionText, type SentenceLookups } from './conditionText';
import type { LogicNode } from '../../../../../domain/Story/LogicNode';

const LOOKUPS: SentenceLookups = {
  pageTitles: { 'page-1': 'The Awakening' },
  items: {
    key: { id: 'key', name: 'Strange Golden Key', description: '', tags: [], multiple: false, contextChoices: [] },
  },
  subplots: [{ id: 'sub-1', name: 'The Hidden Cellar', description: '' }],
};

const node = (blueprintId: string, params: Record<string, unknown> = {}, id = 'n1'): LogicNode => ({
  id,
  type: 'condition',
  name: blueprintId,
  blueprintId,
  params,
});

const group = (blueprintId: string, children: LogicNode[], id = 'g1'): LogicNode => ({
  id,
  type: 'condition',
  name: blueprintId,
  blueprintId,
  children: [{ id: `${id}-conds`, type: 'branch_conditions', name: 'Conditions', children }],
});

const text = (nodes: LogicNode[] | undefined) => conditionText(nodes, LOOKUPS);

describe('conditionText', () => {
  it('says nothing for no condition, which the caller renders as "Always"', () => {
    expect(text([])).toBe('');
    expect(text(undefined)).toBe('');
  });

  it('names the item rather than its id', () => {
    expect(text([node('has_item', { itemId: 'key' })])).toBe('the reader carries the Strange Golden Key');
  });

  it('names the page rather than its id', () => {
    expect(text([node('visited_page', { pageId: 'page-1', not: false })])).toBe(
      'the reader has visited The Awakening'
    );
  });

  it('reads a negated condition as negated', () => {
    expect(text([node('visited_page', { pageId: 'page-1', not: true })])).toBe(
      'the reader has not visited The Awakening'
    );
    expect(text([node('first_visit', { not: true })])).toBe(
      'this is not the reader’s first visit to this page'
    );
  });

  it('falls back to a noun when a token is unset', () => {
    expect(text([node('has_item', {})])).toBe('the reader carries the an item');
    expect(text([node('variable_equals', {})])).toBe('a variable equal a value');
  });

  it('prints a variable comparison as written', () => {
    expect(text([node('variable_equals', { variableKey: 'heroClass', comparison: 'equal', value: 'Mage' })])).toBe(
      'heroClass equal Mage'
    );
  });

  it('ANDs several roots, which is what the evaluator does with them', () => {
    expect(
      text([node('has_item', { itemId: 'key' }, 'a'), node('first_visit', { not: false }, 'b')])
    ).toBe('the reader carries the Strange Golden Key and this is the reader’s first visit to this page');
  });

  it('joins a group with its own word', () => {
    const or = group('or_group', [
      node('has_item', { itemId: 'key' }, 'a'),
      node('first_visit', { not: false }, 'b'),
    ]);

    expect(text([or])).toContain(' or ');
  });

  it('brackets a nested group so the reading cannot be mistaken', () => {
    const inner = group('or_group', [node('has_item', { itemId: 'key' }, 'a'), node('first_visit', {}, 'b')], 'inner');
    const outer = group('and_group', [node('visited_page', { pageId: 'page-1' }, 'c'), inner], 'outer');

    expect(text([outer])).toMatch(/ and \(.+ or .+\)/);
  });

  it('says an empty group is empty rather than rendering nothing', () => {
    expect(text([group('and_group', [])])).toBe('no conditions yet');
  });

  it('admits when it does not recognise a condition', () => {
    expect(text([node('no_such_blueprint')])).toBe('an unrecognised condition');
  });
});
