import { describe, it, expect } from 'vitest';
import { buildHealthReport, type HealthSources } from './buildHealthReport';
import { buildUsageIndex } from '../usage/buildUsageIndex';
import { emptyUsageIndex } from '../usage/usageReference';
import type { HealthCheckId } from './healthFinding';
import type { Page } from '../../../domain/Page/Page';
import type { Choice } from '../../../domain/Choice/Choice';
import type { LogicNode } from '../../../domain/Story/LogicNode';

const prose = [{ id: 'para', text: '<p>Words.</p>' }];

const page = (id: string, over: Partial<Page> = {}): Page => ({
  id,
  title: id,
  paragraphs: prose,
  choices: [],
  ...over,
});

const to = (id: string, targetPageId?: string): Choice => ({
  id,
  text: `go to ${targetPageId ?? 'nowhere'}`,
  targetPageId,
});

const action = (blueprintId: string, params: Record<string, unknown> = {}): LogicNode => ({
  id: `n-${blueprintId}`,
  type: 'action',
  name: blueprintId,
  blueprintId,
  params,
});

const report = (over: Partial<HealthSources> = {}) => {
  const sources: HealthSources = {
    pages: {},
    items: {},
    variables: {},
    audio: {},
    atmospheres: {},
    startPageId: null,
    contextualText: {},
    usage: emptyUsageIndex(),
    ...over,
  };
  return buildHealthReport(sources);
};

const findings = (result: ReturnType<typeof report>, id: HealthCheckId): string[] =>
  result.checks.find((check) => check.id === id)!.findings.map((finding) => finding.label);

describe('buildHealthReport', () => {
  it('reports every check even when the story is empty', () => {
    const result = report();
    expect(result.checks.map((check) => check.id)).toEqual([
      'no-start-page',
      'unreachable-pages',
      'dangling-targets',
      'dangling-marks',
      'endings',
      'inert-choices',
      'unwritten-pages',
      'empty-moments',
      'unused-data',
    ]);
  });

  describe('the start page', () => {
    it('asks for one when none is set', () => {
      expect(findings(report(), 'no-start-page')).toEqual(['No start page set']);
    });

    it('says so when the named page has gone', () => {
      const result = report({ pages: { a: page('a') }, startPageId: 'deleted' });
      expect(findings(result, 'no-start-page')).toEqual(['The start page is missing']);
    });

    it('is satisfied by a start page that exists', () => {
      const result = report({ pages: { a: page('a') }, startPageId: 'a' });
      expect(findings(result, 'no-start-page')).toEqual([]);
    });
  });

  describe('unreachable pages', () => {
    it('follows choices forward from the start', () => {
      const result = report({
        pages: {
          a: page('a', { choices: [to('c1', 'b')] }),
          b: page('b'),
          orphan: page('orphan'),
        },
        startPageId: 'a',
      });

      expect(findings(result, 'unreachable-pages')).toEqual(['orphan']);
    });

    /*
     * The reason this walks forward instead of counting inbound choices: each of
     * these two pages has a choice leading to it, so an inbound count would pass
     * them both while a reader can reach neither.
     */
    it('catches an island whose pages only link to each other', () => {
      const result = report({
        pages: {
          start: page('start'),
          islandA: page('islandA', { choices: [to('c1', 'islandB')] }),
          islandB: page('islandB', { choices: [to('c2', 'islandA')] }),
        },
        startPageId: 'start',
      });

      expect(findings(result, 'unreachable-pages')).toEqual(['islandA', 'islandB']);
    });

    it('counts a page reached only by a subplot jump three branches deep', () => {
      const result = report({
        pages: {
          a: page('a', {
            events: [
              {
                id: 'e1',
                name: 'onEnter',
                logicTree: [
                  {
                    id: 'cond',
                    type: 'condition',
                    name: 'Has Item',
                    blueprintId: 'has_item',
                    children: [
                      {
                        id: 'then',
                        type: 'branch_then',
                        name: 'Then',
                        children: [action('go_to_subplot', { targetPageId: 'far' })],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
          far: page('far'),
        },
        startPageId: 'a',
      });

      expect(findings(result, 'unreachable-pages')).toEqual([]);
    });

    it('treats a jump inside an item’s context choice as reachable from anywhere', () => {
      const result = report({
        pages: { a: page('a'), shrine: page('shrine') },
        items: {
          key: {
            id: 'key',
            name: 'a key',
            description: '',
            tags: [],
            multiple: false,
            contextChoices: [
              {
                id: 'ctx',
                text: 'Use it',
                actions: [{ id: 'act', blueprintId: 'go_to_subplot', params: { targetPageId: 'shrine' } }],
              },
            ],
          },
        },
        startPageId: 'a',
      });

      expect(findings(result, 'unreachable-pages')).toEqual([]);
    });

    it('does not run without a start page, and says why', () => {
      const result = report({ pages: { a: page('a'), b: page('b') } });
      const check = result.checks.find((c) => c.id === 'unreachable-pages')!;

      expect(check.findings).toEqual([]);
      expect(check.clear).toContain('without a start page');
    });

    it('does not treat a message-posting rule as movement', () => {
      const result = report({
        pages: {
          a: page('a', {
            events: [{ id: 'e1', name: 'onEnter', logicTree: [action('post_message', { message: 'hi' })] }],
          }),
          b: page('b'),
        },
        startPageId: 'a',
      });

      expect(findings(result, 'unreachable-pages')).toEqual(['b']);
    });
  });

  describe('choices pointing nowhere', () => {
    it('reports a target that no page answers to', () => {
      const result = report({
        pages: { a: page('a', { choices: [to('c1', 'deleted')] }) },
        startPageId: 'a',
      });

      const check = result.checks.find((c) => c.id === 'dangling-targets')!;
      expect(check.findings).toHaveLength(1);
      expect(check.findings[0].detail).toContain('points at deleted');
      expect(check.findings[0].pageId).toBe('a');
    });

    it('does not confuse an unlinked choice for a dangling one', () => {
      const result = report({
        pages: { a: page('a', { choices: [to('c1')] }) },
        startPageId: 'a',
      });

      expect(findings(result, 'dangling-targets')).toEqual([]);
    });
  });

  /*
   * An inventory rather than a fault. The player ends the story whenever a page
   * offers no choices, so this is how every ending is written — reporting them as
   * dead ends would flag every intentional ending in every story.
   */
  describe('endings', () => {
    it('lists a page nothing leads onward from', () => {
      const result = report({ pages: { a: page('a') }, startPageId: 'a' });
      expect(findings(result, 'endings')).toEqual(['a']);
    });

    it('says when an ending also records data', () => {
      const result = report({
        pages: {
          a: page('a', {
            events: [{ id: 'e1', name: 'onEnter', logicTree: [action('end_story', { data: [] })] }],
          }),
        },
        startPageId: 'a',
      });

      const check = result.checks.find((c) => c.id === 'endings')!;
      expect(check.findings[0].detail).toBe('nothing leads onward, and it records an ending');
    });

    it('is not an ending if a rule carries the reader onward', () => {
      const result = report({
        pages: {
          a: page('a', {
            events: [{ id: 'e1', name: 'onEnter', logicTree: [action('go_to_subplot', { targetPageId: 'b' })] }],
          }),
          b: page('b'),
        },
        startPageId: 'a',
      });

      expect(findings(result, 'endings')).toEqual(['b']);
    });
  });

  describe('choices that do nothing', () => {
    it('reports a choice with no target and no rules', () => {
      const result = report({
        pages: { a: page('a', { choices: [to('c1')] }) },
        startPageId: 'a',
      });

      expect(findings(result, 'inert-choices')).toEqual(['go to nowhere']);
    });

    /* Action-only choices are a supported shape, not a mistake. */
    it('leaves an action-only choice alone', () => {
      const result = report({
        pages: {
          a: page('a', {
            choices: [
              {
                id: 'c1',
                text: 'Search your pockets',
                events: [{ id: 'e1', name: 'onSelect', logicTree: [action('give_item', { itemId: 'key' })] }],
              },
            ],
          }),
        },
        startPageId: 'a',
      });

      expect(findings(result, 'inert-choices')).toEqual([]);
    });

    it('leaves a legacy action-only choice alone too', () => {
      const result = report({
        pages: {
          a: page('a', {
            choices: [{ id: 'c1', text: 'Ring the bell', actions: [{ id: 'act', blueprintId: 'post_message', params: {} }] }],
          }),
        },
        startPageId: 'a',
      });

      expect(findings(result, 'inert-choices')).toEqual([]);
    });
  });

  describe('unwritten pages and empty moments', () => {
    it('lists pages with no prose', () => {
      const result = report({
        pages: { written: page('written'), blank: page('blank', { paragraphs: [] }) },
        startPageId: 'written',
      });

      expect(findings(result, 'unwritten-pages')).toEqual(['blank']);
    });

    it('names the moment that was added but never filled', () => {
      const result = report({
        pages: { a: page('a', { events: [{ id: 'e1', name: 'onExit', logicTree: [] }] }) },
        startPageId: 'a',
      });

      const check = result.checks.find((c) => c.id === 'empty-moments')!;
      expect(check.findings[0].detail).toContain('onExit');
    });
  });

  describe('unused data', () => {
    it('agrees with the usage index rather than deciding for itself', () => {
      const pages = {
        a: page('a', {
          events: [{ id: 'e1', name: 'onEnter', logicTree: [action('give_item', { itemId: 'used_item' })] }],
        }),
      };
      const items = {
        used_item: { id: 'used_item', name: 'a lamp', description: '', tags: [], multiple: false, contextChoices: [] },
        spare: { id: 'spare', name: 'a spare', description: '', tags: [], multiple: false, contextChoices: [] },
      };

      const result = report({
        pages,
        items,
        variables: { gold: { type: 'number', value: 0 } },
        audio: { rain: { id: 'rain', title: 'Rain', description: '', type: 'music', src: '' } },
        atmospheres: { calm: { id: 'calm', title: 'Calm' } },
        startPageId: 'a',
        usage: buildUsageIndex({ pages, items, atmospheres: { calm: { id: 'calm', title: 'Calm' } }, statusData: [] }),
      });

      // Alphabetical without regard to case, which is what `localeCompare` gives.
      expect(findings(result, 'unused-data')).toEqual(['a spare', 'Calm', 'gold', 'Rain']);
    });
  });

  describe('the tallies', () => {
    it('counts only breaking findings for the rail, and everything for the screen', () => {
      const result = report({
        pages: {
          a: page('a', { choices: [to('c1', 'gone')] }),
          orphan: page('orphan', { paragraphs: [] }),
        },
        startPageId: 'a',
      });

      // Breaking: one unreachable page, one dangling target.
      expect(result.breakingCount).toBe(2);
      /*
       * Plus notes: `orphan` is both an ending and unwritten, and `a` counts as an
       * ending too — its only choice points at a page that no longer exists, so
       * nothing actually leads onward from it.
       */
      expect(result.totalCount).toBe(5);
    });

    it('reports a clean story as clean', () => {
      const result = report({
        pages: {
          a: page('a', { choices: [to('c1', 'b')] }),
          b: page('b', {
            events: [{ id: 'e1', name: 'onEnter', logicTree: [action('end_story', { data: [] })] }],
          }),
        },
        startPageId: 'a',
      });

      expect(result.breakingCount).toBe(0);
      // `b` ends the story, which the inventory reports without it being a fault.
      expect(result.totalCount).toBe(1);
    });
  });
});
