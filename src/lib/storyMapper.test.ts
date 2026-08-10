import { describe, it, expect } from 'vitest';
import { compileGraphToStory, parseStoryToGraph } from './storyMapper';
import type { PageNodeType } from '../features/editor/nodes/PageNode';
import type { ActionNodeType } from '../features/editor/nodes/ActionNode';
import type { PortalNodeType } from '../features/editor/nodes/PortalNode';
import type { StoryData } from '../domain/Story/StoryData';
import { CURRENT_VERSION } from '../domain/Story/migrations/migrations';
import type { Edge } from '@xyflow/react';
import type { Page } from '../domain/Page/Page';

describe('storyMapper', () => {

  const mockVariables = {
    keyOpen: { type: 'boolean' as const, value: false, tags: [] }
  };

  const mockPages: Record<string, Page> = {
    'page-1': {
      id: 'page-1',
      title: 'Start Page',
      paragraphs: [{ id: 'p1', text: 'Hello' }],
      choices: [
        { id: 'c1', text: 'Go north' },
        { id: 'c2', text: 'Open chest', actions: [{ id: 'a1', blueprintId: 'set_variable', params: { var: 'keyOpen', val: 'true' } }] }
      ],
      actions: [{ id: 'pa1', blueprintId: 'log', params: { msg: 'start' } }]
    },
    'page-2': {
      id: 'page-2',
      title: 'North Page',
      subplotId: 'subplot-1',
      paragraphs: [],
      choices: []
    }
  };

  const mockNodes: (PageNodeType | ActionNodeType | PortalNodeType)[] = [
    {
      id: 'page-1',
      type: 'pageNode',
      position: { x: 10, y: 20 },
      data: {
        title: 'Start Page',
        paragraphs: [{ id: 'p1', text: 'Hello' }],
        choices: [
          { id: 'c1', text: 'Go north', targetPageId: '' },
          { id: 'c2', text: 'Open chest', actions: [{ id: 'a1', blueprintId: 'set_variable', params: { var: 'keyOpen', val: 'true' } }] }
        ],
        actions: [{ id: 'pa1', blueprintId: 'log', params: { msg: 'start' } }]
      }
    },
    {
      id: 'page-2',
      type: 'pageNode',
      position: { x: 300, y: 0 },
      data: {
        title: 'North Page',
        subplotId: 'subplot-1',
        paragraphs: [],
        choices: []
      }
    },
    {
      id: 'action-node-c2',
      type: 'actionNode',
      position: { x: 150, y: 100 },
      data: {
        sourcePageId: 'page-1',
        choiceId: 'c2',
        choiceText: 'Open chest',
        actionNames: ['set_variable']
      }
    }
  ];

  const mockEdges: Edge[] = [
    {
      id: 'e-c1-page-2',
      source: 'page-1',
      target: 'page-2',
      sourceHandle: 'c1'
    },
    {
      id: 'se-c2-action',
      source: 'page-1',
      target: 'action-node-c2',
      sourceHandle: 'c2'
    }
  ];

  const expectedStoryData: StoryData = {
    version: CURRENT_VERSION,
    title: 'Test Story',
    description: 'A story for testing mapping',
    startPageId: 'page-1',
    variables: mockVariables,
    subplots: [{ id: 'subplot-1', name: 'Cellar', description: 'Dark place' }],
    pages: [
      {
        id: 'page-1',
        title: 'Start Page',
        paragraphs: [{ id: 'p1', text: 'Hello' }],
        choices: [
          { id: 'c1', text: 'Go north', targetPageId: 'page-2' },
          { id: 'c2', text: 'Open chest', actions: [{ id: 'a1', blueprintId: 'set_variable', params: { var: 'keyOpen', val: 'true' } }] }
        ],
        actions: [{ id: 'pa1', blueprintId: 'log', params: { msg: 'start' } }]
      },
      {
        id: 'page-2',
        title: 'North Page',
        subplotId: 'subplot-1',
        paragraphs: [],
        choices: []
      }
    ],
    uiMetadata: {
      nodes: mockNodes,
      edges: mockEdges
    }
  };

  describe('compileGraphToStory', () => {
    it('should correctly map React Flow nodes and edges into pure StoryData', () => {
      const result = compileGraphToStory(
        mockNodes,
        mockEdges,
        mockPages,
        mockVariables,
        {},
        { title: 'Test Story', description: 'A story for testing mapping', startPageId: 'page-1' }
      );

      // Verify page properties
      expect(result.pages.length).toBe(2);
      expect(result.pages[0].id).toBe('page-1');
      expect(result.pages[1].subplotId).toBe('subplot-1');
      expect(result.pages[0].actions?.length).toBe(1);

      // Verify edge mapping into choices targetPageId
      expect(result.pages[0].choices![0].targetPageId).toBe('page-2');

      // Verify choice actions are preserved
      expect(result.pages[0].choices![1].actions?.length).toBe(1);
      // But choice 2 should NOT have a targetPageId because its edge is synthetic (starts with 'se-')
      expect(result.pages[0].choices![1].targetPageId).toBeUndefined();

      // Verify full graph state is preserved in uiMetadata
      expect(result.uiMetadata?.nodes?.length).toBe(3);
      expect(result.uiMetadata?.edges?.length).toBe(2);
    });

    it('should filter out synthetic nodes when compiling back to domain story', () => {
      const result = compileGraphToStory(mockNodes, mockEdges, mockPages, {}, {});
      expect(result.pages.length).toBe(2);
      expect(result.pages.find(p => p.id === 'action-node-c2')).toBeUndefined();
    });

    it('should handle choices with missing edges gracefully', () => {
      const result = compileGraphToStory(mockNodes, [], mockPages, {}, {});
      expect(result.pages[0].choices![0].targetPageId).toBeUndefined();
    });
  });

  describe('parseStoryToGraph', () => {
    it('keeps the saved layout but refreshes page data from the domain', () => {
      const { nodes, edges } = parseStoryToGraph(expectedStoryData);

      // Layout is taken from uiMetadata verbatim.
      const layoutOf = (list: { id: string; type?: string; position: { x: number; y: number } }[]) =>
        list.map(({ id, type, position }) => ({ id, type, position }));
      expect(layoutOf(nodes)).toEqual(layoutOf(mockNodes));
      expect(edges).toEqual(expectedStoryData.uiMetadata?.edges);

      /*
       * Node data is not. uiMetadata holds a copy of the React Flow state that
       * can be stale — here it has an empty targetPageId for c1 where the
       * domain page says page-2 — so parseStoryToGraph overwrites it from
       * `pages`. Asserting the nodes come back untouched would contradict the
       * reason the sync exists.
       */
      const pageOne = nodes.find((node) => node.id === 'page-1') as PageNodeType;
      expect(pageOne.data.choices[0].targetPageId).toBe('page-2');
      expect(pageOne.data.title).toBe('Start Page');
      // Absent collections are normalised rather than left undefined.
      const pageTwo = nodes.find((node) => node.id === 'page-2') as PageNodeType;
      expect(pageTwo.data.events).toEqual([]);

      // Synthetic nodes carry no domain page, so they pass through untouched.
      const actionNode = nodes.find((node) => node.id === 'action-node-c2');
      expect(actionNode?.data).toEqual(mockNodes[2].data);
    });

    it('should provide default layout fallback if uiMetadata nodes are missing', () => {
      const { uiMetadata, ...storyWithoutPos } = expectedStoryData;
      const { nodes, edges } = parseStoryToGraph(storyWithoutPos);

      // Falls back to creating basic grids of pageNodes, plus 1 synthetic action node!
      expect(nodes.length).toBe(3);
      expect(nodes[0].position).toBeDefined();
      expect(nodes[0].position.x).toBe(0);
      expect(nodes[1].position.x).toBe(350);

      // 1 real page-to-page edge + 1 synthetic edge
      expect(edges.length).toBe(2);
    });
  });

});
