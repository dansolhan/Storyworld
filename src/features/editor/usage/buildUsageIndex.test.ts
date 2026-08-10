import { describe, it, expect } from 'vitest';
import { buildUsageIndex } from './buildUsageIndex';
import { variableTokensIn } from './variableTokens';
import type { Page } from '../../../domain/Page/Page';
import type { Item } from '../../../domain/Item/Item';

const page = (id: string, overrides: Partial<Page> = {}): Page => ({
  id,
  title: `Page ${id}`,
  paragraphs: [],
  choices: [],
  ...overrides,
});

const item = (id: string, overrides: Partial<Item> = {}): Item => ({
  id,
  name: id,
  description: '',
  tags: [],
  multiple: false,
  contextChoices: [],
  ...overrides,
});

const build = (sources: Partial<Parameters<typeof buildUsageIndex>[0]>) =>
  buildUsageIndex({ pages: {}, items: {}, atmospheres: {}, statusData: [], ...sources });

describe('variableTokensIn', () => {
  it('finds tokens and tolerates whitespace inside the braces', () => {
    expect(variableTokensIn('Hello {{playerName}} and {{ gold }}.')).toEqual(['playerName', 'gold']);
  });

  it('finds nothing in text without tokens', () => {
    expect(variableTokensIn('Just prose.')).toEqual([]);
  });
});

describe('buildUsageIndex', () => {
  it('reports nothing for an empty story', () => {
    const index = build({});
    expect(index.item).toEqual({});
    expect(index.variable).toEqual({});
  });

  it('counts a variable printed in a paragraph', () => {
    const index = build({
      pages: { p1: page('p1', { paragraphs: [{ id: 'a', text: '<p>Hi {{playerName}}</p>' }] }) },
    });

    expect(index.variable.playerName.pageCount).toBe(1);
    expect(index.variable.playerName.references[0]).toEqual({
      pageId: 'p1',
      pageTitle: 'Page p1',
      relationship: 'printed',
    });
  });

  it('counts a variable printed in choice text', () => {
    const index = build({
      pages: { p1: page('p1', { choices: [{ id: 'c1', text: 'Pay {{gold}}' }] }) },
    });
    expect(index.variable.gold.pageCount).toBe(1);
  });

  it('reads item references off blueprint params, with the right relationship', () => {
    const index = build({
      pages: {
        p1: page('p1', {
          events: [
            {
              id: 'e1',
              name: 'onEnter',
              logicTree: [
                { id: 'n1', type: 'action', name: 'Give', blueprintId: 'give_item', params: { itemId: 'key' } },
              ],
            },
          ],
        }),
        p2: page('p2', {
          choices: [
            {
              id: 'c1',
              text: 'Unlock',
              events: [
                {
                  id: 'e2',
                  name: 'calculateVisibility',
                  logicTree: [
                    { id: 'n2', type: 'condition', name: 'Has', blueprintId: 'has_item', params: { itemId: 'key' } },
                  ],
                },
              ],
            },
          ],
        }),
      },
    });

    expect(index.item.key.pageCount).toBe(2);
    expect(index.item.key.references.map((r) => r.relationship).sort()).toEqual([
      'condition',
      'given',
    ]);
  });

  it('walks nested branches of a logic tree', () => {
    const index = build({
      pages: {
        p1: page('p1', {
          events: [
            {
              id: 'e1',
              name: 'onEnter',
              logicTree: [
                {
                  id: 'cond',
                  type: 'condition',
                  name: 'If',
                  blueprintId: 'variable_equals',
                  params: { variableKey: 'metGil' },
                  children: [
                    {
                      id: 'then',
                      type: 'branch_then',
                      name: 'Then',
                      children: [
                        {
                          id: 'deep',
                          type: 'action',
                          name: 'Give',
                          blueprintId: 'give_item',
                          params: { itemId: 'lamp' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      },
    });

    // Found only by recursing through branch_then.
    expect(index.item.lamp.pageCount).toBe(1);
    expect(index.variable.metGil.pageCount).toBe(1);
  });

  it('does not double-count a page that references the same thing twice', () => {
    const index = build({
      pages: {
        p1: page('p1', {
          paragraphs: [
            { id: 'a', text: '{{gold}}' },
            { id: 'b', text: '{{gold}} again' },
          ],
        }),
      },
    });

    expect(index.variable.gold.pageCount).toBe(1);
    expect(index.variable.gold.references).toHaveLength(2);
  });

  it("counts a page's atmosphere and subplot", () => {
    const index = build({
      pages: { p1: page('p1', { atmosphereId: 'dusk', subplotId: 'cellar' }) },
    });
    expect(index.atmosphere.dusk.pageCount).toBe(1);
    expect(index.subplot.cellar.pageCount).toBe(1);
  });

  it('counts a track used by an atmosphere, with no page attached', () => {
    const index = build({
      atmospheres: { dusk: { id: 'dusk', title: 'Dusk', music: 'strings' } },
    });

    expect(index.audio.strings.references).toEqual([
      { pageId: undefined, pageTitle: undefined, relationship: 'plays' },
    ]);
    // Story-level, so it counts as used without belonging to any page.
    expect(index.audio.strings.pageCount).toBe(0);
  });

  it('counts a variable shown in the status ledger', () => {
    const index = build({
      statusData: [{ id: 'hp', title: 'HP', value: '{{hp}} / {{maxHp}}' }],
    });
    expect(Object.keys(index.variable).sort()).toEqual(['hp', 'maxHp']);
    expect(index.variable.hp.references[0].relationship).toBe('shown in status');
  });

  it("counts an item referenced only by another item's context choice", () => {
    const index = build({
      items: {
        lamp: item('lamp', {
          contextChoices: [
            {
              id: 'cc1',
              text: 'Light it with {{matches}}',
              actions: [{ id: 'a1', blueprintId: 'remove_item', params: { itemId: 'oil' } }],
            },
          ],
        }),
      },
    });

    // Indirect, but still in use — which is what "safe to delete?" means.
    expect(index.item.oil.references[0].relationship).toBe('taken away');
    expect(index.variable.matches.references[0].relationship).toBe('context choice');
  });

  it('walks legacy conditionals attached to an action', () => {
    const index = build({
      pages: {
        p1: page('p1', {
          actions: [
            {
              id: 'a1',
              blueprintId: 'give_item',
              params: { itemId: 'key' },
              conditionals: [{ id: 'c1', blueprintId: 'has_item', params: { itemId: 'lamp' } }],
            },
          ],
        }),
      },
    });

    expect(index.item.key.pageCount).toBe(1);
    expect(index.item.lamp.pageCount).toBe(1);
  });

  it('ignores a param that is not a string', () => {
    const index = build({
      pages: {
        p1: page('p1', {
          events: [
            {
              id: 'e1',
              name: 'onEnter',
              logicTree: [
                { id: 'n1', type: 'action', name: 'Give', blueprintId: 'give_item', params: { itemId: null } },
              ],
            },
          ],
        }),
      },
    });
    expect(index.item).toEqual({});
  });

  it('ignores params on a blueprint that declares no references', () => {
    const index = build({
      pages: {
        p1: page('p1', {
          events: [
            {
              id: 'e1',
              name: 'onEnter',
              logicTree: [
                { id: 'n1', type: 'action', name: 'Say', blueprintId: 'post_message', params: { itemId: 'key' } },
              ],
            },
          ],
        }),
      },
    });
    // post_message declares nothing, so a stray itemId param is not a reference.
    expect(index.item).toEqual({});
  });
});
