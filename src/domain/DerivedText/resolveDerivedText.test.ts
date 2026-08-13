import { describe, it, expect } from 'vitest';
import { hasFallback, resolveDerivedText, resolveOutcome } from './resolveDerivedText';
import { derivedIdsIn, renderDerivedToken, resolveDerivedTokens } from './derivedToken';
import type { DerivedText } from './DerivedText';
import type { LogicNode } from '../Story/LogicNode';

const varIs = (variableKey: string, value: string): LogicNode[] => [
  {
    id: `c-${variableKey}-${value}`,
    type: 'condition',
    name: 'Check Variable Value',
    blueprintId: 'variable_equals',
    params: { variableKey, comparison: 'equal', value },
  },
];

const context = (variables: Record<string, unknown>) => ({
  variables,
  visitedPageIds: [],
  currentPageId: 'page-1',
  inventory: {},
});

const FERRYMAN: DerivedText = {
  id: 'dt-1',
  outcomes: [
    { id: 'o1', text: 'Old Gil', condition: varIs('metGil', 'true') },
    { id: 'o2', text: 'the ferryman', condition: varIs('sawFerry', 'true') },
    { id: 'o3', text: 'a stranger', condition: [] },
  ],
};

describe('resolveDerivedText', () => {
  it('returns the first outcome whose condition holds', () => {
    expect(
      resolveDerivedText(FERRYMAN, context({ metGil: { type: 'boolean', value: true } }))
    ).toBe('Old Gil');
  });

  /* Order is the semantics: the most specific case is written first. */
  it('prefers an earlier match over a later one', () => {
    const both = context({
      metGil: { type: 'boolean', value: true },
      sawFerry: { type: 'boolean', value: true },
    });
    expect(resolveDerivedText(FERRYMAN, both)).toBe('Old Gil');
  });

  it('falls through to the unconditional outcome', () => {
    expect(resolveDerivedText(FERRYMAN, context({}))).toBe('a stranger');
  });

  it('takes a later match when the earlier condition fails', () => {
    expect(
      resolveDerivedText(FERRYMAN, context({ sawFerry: { type: 'boolean', value: true } }))
    ).toBe('the ferryman');
  });

  it('resolves to nothing when every outcome is conditional and none hold', () => {
    const noFallback: DerivedText = { id: 'dt-2', outcomes: [FERRYMAN.outcomes[0]] };
    expect(resolveDerivedText(noFallback, context({}))).toBe('');
  });

  it('resolves to nothing when there are no outcomes at all', () => {
    expect(resolveDerivedText({ id: 'dt-3', outcomes: [] }, context({}))).toBe('');
  });

  it('names which outcome won, for the editor badge', () => {
    expect(resolveOutcome(FERRYMAN, context({}))?.id).toBe('o3');
  });
});

describe('hasFallback', () => {
  it('is true when some outcome is unconditional', () => {
    expect(hasFallback(FERRYMAN)).toBe(true);
  });

  it('is false when every outcome carries a condition', () => {
    expect(hasFallback({ id: 'x', outcomes: [FERRYMAN.outcomes[0]] })).toBe(false);
  });

  it('is false for no outcomes', () => {
    expect(hasFallback({ id: 'x', outcomes: [] })).toBe(false);
  });
});

describe('derived tokens in prose', () => {
  const html = `<p>a ${renderDerivedToken('dt-1')} stood at the rail</p>`;

  it('finds the ids a paragraph uses', () => {
    expect(derivedIdsIn(html)).toEqual(['dt-1']);
    expect(derivedIdsIn('<p>plain</p>')).toEqual([]);
  });

  it('replaces the token with what it resolves to', () => {
    expect(resolveDerivedTokens(html, () => 'Old Gil')).toBe('<p>a Old Gil stood at the rail</p>');
  });

  /* The sentence closes over a token that resolves to nothing. */
  it('leaves no artefact when a token resolves to nothing', () => {
    expect(resolveDerivedTokens(html, () => '')).toBe('<p>a  stood at the rail</p>');
  });

  it('resolves each token independently', () => {
    const two = `<p>${renderDerivedToken('a')} and ${renderDerivedToken('b')}</p>`;
    expect(resolveDerivedTokens(two, (id) => id.toUpperCase())).toBe('<p>A and B</p>');
  });

  it('ignores a span that is not a derived token', () => {
    expect(derivedIdsIn('<p><span class="other">x</span></p>')).toEqual([]);
  });
});
