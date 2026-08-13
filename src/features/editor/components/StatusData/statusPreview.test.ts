import { describe, it, expect } from 'vitest';
import { buildStatusPreview } from './statusPreview';
import type { SentenceLookups } from '../RuleEditor/sentence/conditionText';
import type { StatusData } from '../../../../domain/Story/StatusData';
import type { StoryVariable } from '../../../../domain/Story/Variable';
import type { LogicNode } from '../../../../domain/Story/LogicNode';

const LOOKUPS: SentenceLookups = { pageTitles: {}, items: {}, subplots: [] };

const variables: Record<string, StoryVariable> = {
  hp: { type: 'number', value: 30 },
  maxHp: { type: 'number', value: 30 },
  isPoisoned: { type: 'boolean', value: false },
  heroClass: { type: 'string', value: 'Knight' },
};

const condition = (variableKey: string, value: string): LogicNode[] => [
  {
    id: `cond-${variableKey}`,
    type: 'condition',
    name: 'Check Variable Value',
    blueprintId: 'variable_equals',
    params: { variableKey, comparison: 'equal', value },
  },
];

const entry = (over: Partial<StatusData> = {}): StatusData => ({
  id: 'sd-1',
  title: 'HP',
  value: '{{hp}} / {{maxHp}}',
  ...over,
});

const preview = (entries: StatusData[]) => buildStatusPreview(entries, variables, LOOKUPS);

describe('buildStatusPreview', () => {
  it('fills the value from the starting values', () => {
    expect(preview([entry()])[0].value).toBe('30 / 30');
  });

  it('leaves an unknown token visible rather than blanking it', () => {
    expect(preview([entry({ value: '{{mana}}' })])[0].value).toBe('{{mana}}');
  });

  it('shows an entry with no condition', () => {
    const [shown] = preview([entry()]);
    expect(shown.isVisible).toBe(true);
    expect(shown.reason).toBe('');
  });

  it('hides an entry whose condition does not hold, and names what it needs', () => {
    const [hidden] = preview([
      entry({ title: 'Poisoned', value: '☠ Poisoned', condition: condition('isPoisoned', 'true') }),
    ]);

    expect(hidden.isVisible).toBe(false);
    expect(hidden.reason).toBe('hidden — needs: isPoisoned equal true');
  });

  it('shows an entry whose condition does hold', () => {
    const [shown] = preview([entry({ condition: condition('heroClass', 'Knight') })]);

    expect(shown.isVisible).toBe(true);
    expect(shown.reason).toBe('');
  });

  /* Highest priority first, which is the order the player reads them in. */
  it('orders by priority, as the player does', () => {
    const entries = [
      entry({ id: 'low', title: 'Gold', priority: 10 }),
      entry({ id: 'high', title: 'HP', priority: 20 }),
      entry({ id: 'mid', title: 'Mana', priority: 15 }),
    ];

    expect(preview(entries).map((row) => row.entry.id)).toEqual(['high', 'mid', 'low']);
  });

  it('treats a missing priority as zero rather than dropping the entry', () => {
    const entries = [entry({ id: 'none', title: 'A' }), entry({ id: 'ten', title: 'B', priority: 10 })];
    expect(preview(entries).map((row) => row.entry.id)).toEqual(['ten', 'none']);
  });

  /*
   * Hidden entries stay in the list on purpose: in the editor the useful thing is
   * seeing that the entry exists and why it is not showing. The player drops them.
   */
  it('keeps hidden entries rather than omitting them', () => {
    const rows = preview([
      entry({ id: 'shown' }),
      entry({ id: 'hidden', condition: condition('isPoisoned', 'true') }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.isVisible)).toContain(false);
  });

  /*
   * The evaluator fails open on a blueprint it does not recognise, so a story
   * carrying a condition from a newer build shows the entry rather than silently
   * swallowing it. The preview inherits that, which is the point of sharing
   * `statusEntryIsVisible` — the alternative would be a preview that hides what
   * the player shows.
   */
  it('shows an entry whose condition this build cannot evaluate', () => {
    const [row] = preview([
      entry({
        condition: [{ id: 'c1', type: 'condition', name: 'unknown', blueprintId: 'no_such_blueprint' }],
      }),
    ]);

    expect(row.isVisible).toBe(true);
    expect(row.reason).toBe('');
  });
});
