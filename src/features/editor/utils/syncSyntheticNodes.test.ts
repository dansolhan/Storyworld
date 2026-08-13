import { describe, it, expect } from 'vitest';
import { syncSyntheticNodes } from './syncSyntheticNodes';
import type { EditorNode } from '../store/editorTypes';
import type { Page } from '../../../domain/Page/Page';
import type { Choice } from '../../../domain/Choice/Choice';

const pageNode = (id: string, subplotId?: string): EditorNode => ({
  id,
  type: 'pageNode',
  position: { x: 0, y: 0 },
  data: { type: 'location', title: id, paragraphs: [], choices: [], subplotId },
});

const page = (id: string, choices: Choice[], subplotId?: string): Page => ({
  id,
  title: id,
  paragraphs: [],
  choices,
  subplotId,
});

const crossingChoice = (id: string, text: string, subplotId: string | null, targetPageId: string): Choice => ({
  id,
  text,
  events: [
    {
      id: `e-${id}`,
      name: 'onSelect',
      logicTree: [
        {
          id: `n-${id}`,
          type: 'action',
          name: 'Go to Subplot',
          blueprintId: 'go_to_subplot',
          params: { subplotId, targetPageId },
        },
      ],
    },
  ],
});

const SUBPLOTS = [{ id: 'sub-cellar', name: 'The Hidden Cellar', description: '' }];

const sync = (pages: Record<string, Page>, nodes: EditorNode[], currentPlotId: string | null = null) =>
  syncSyntheticNodes(nodes, [], pages, SUBPLOTS, currentPlotId);

describe('syncSyntheticNodes', () => {
  /*
   * The regression this pins: crossings live in `events` after the 1.0.0 migration,
   * and only `choice.actions` was read — so no crossing card was ever created for a
   * migrated story, and the canvas silently lost them.
   */
  it('creates a crossing for a choice whose action lives in an event', () => {
    const pages = {
      'page-1': page('page-1', [crossingChoice('c1', 'Lift the floorboard', 'sub-cellar', 'page-9')]),
      'page-9': page('page-9', [], 'sub-cellar'),
    };

    const { nodes } = sync(pages, [pageNode('page-1'), pageNode('page-9', 'sub-cellar')]);
    const portal = nodes.find((node) => node.type === 'portalNode');

    expect(portal).toBeTruthy();
    expect(portal!.data).toMatchObject({
      subplotName: 'The Hidden Cellar',
      targetPageName: 'page-9',
      sourcePageTitle: 'page-1',
      choiceText: 'Lift the floorboard',
    });
  });

  it('counts what is on the other side, which is what the card stands in for', () => {
    const pages = {
      'page-1': page('page-1', [crossingChoice('c1', 'Down', 'sub-cellar', 'page-9')]),
      'page-9': page('page-9', [], 'sub-cellar'),
      'page-10': page('page-10', [], 'sub-cellar'),
    };

    const { nodes } = sync(pages, [
      pageNode('page-1'),
      pageNode('page-9', 'sub-cellar'),
      pageNode('page-10', 'sub-cellar'),
    ]);

    expect(nodes.find((node) => node.type === 'portalNode')!.data.subplotPageCount).toBe(2);
  });

  it('names the main plot when a crossing returns to it', () => {
    const pages = {
      'page-9': page('page-9', [crossingChoice('c1', 'Climb back up', null, 'page-1')], 'sub-cellar'),
      'page-1': page('page-1', []),
    };

    const { nodes } = sync(pages, [pageNode('page-9', 'sub-cellar'), pageNode('page-1')], 'sub-cellar');

    expect(nodes.find((node) => node.type === 'portalNode')!.data).toMatchObject({
      subplotName: 'Main Plot',
      targetPageName: 'page-1',
    });
  });

  it('marks a choice that does something but goes nowhere', () => {
    const pages = {
      'page-1': page('page-1', [
        {
          id: 'c1',
          text: 'Search your pockets',
          events: [
            {
              id: 'e1',
              name: 'onSelect',
              logicTree: [
                { id: 'n1', type: 'action', name: 'Give Item', blueprintId: 'give_item', params: {} },
              ],
            },
          ],
        },
      ]),
    };

    const { nodes } = sync(pages, [pageNode('page-1')]);
    const marker = nodes.find((node) => node.type === 'actionNode');

    expect(marker).toBeTruthy();
    expect(marker!.data.actionNames).toEqual(['give_item']);
  });

  it('leaves a choice that leads to a real page alone', () => {
    const pages = {
      'page-1': page('page-1', [{ id: 'c1', text: 'Onward', targetPageId: 'page-2' }]),
      'page-2': page('page-2', []),
    };

    const { nodes } = sync(pages, [pageNode('page-1'), pageNode('page-2')]);

    expect(nodes.filter((node) => node.type !== 'pageNode')).toEqual([]);
  });

  it('draws the crossing edge dashed, because it leaves the plot', () => {
    const pages = {
      'page-1': page('page-1', [crossingChoice('c1', 'Down', 'sub-cellar', 'page-9')]),
      'page-9': page('page-9', [], 'sub-cellar'),
    };

    const { edges } = sync(pages, [pageNode('page-1'), pageNode('page-9', 'sub-cellar')]);
    const crossing = edges.find((edge) => edge.id.startsWith('se-portal-'));

    expect(crossing!.style).toMatchObject({ strokeDasharray: '5 4' });
  });
});
