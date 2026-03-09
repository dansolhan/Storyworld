import { describe, it, expect } from 'vitest';
import { compileGraphToStory, parseStoryToGraph } from './storyMapper';
import type { PageNodeType } from '../features/editor/nodes/PageNode';
import type { ActionNodeType } from '../features/editor/nodes/ActionNode';
import type { PortalNodeType } from '../features/editor/nodes/PortalNode';
import type { StoryData } from '../domain/Story/StoryData';
import { CURRENT_VERSION } from '../domain/Story/migrations/migrations';

describe('storyMapper', () => {

  const mockVariables = {
    keyOpen: { type: 'boolean' as const, value: false, tags: [] }
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

  const mockEdges = [
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
      nodePositions: {
        'page-1': { x: 10, y: 20 },
        'page-2': { x: 300, y: 0 }
      }
    }
  };

  describe('compileGraphToStory', () => {
    it('should correctly map React Flow nodes and edges into pure StoryData', () => {
      const result = compileGraphToStory(
        mockNodes as any,
        mockEdges as any,
        mockVariables as any,
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

      // Verify node positions preserved in uiMetadata
      expect(result.uiMetadata?.nodePositions?.['page-1']).toEqual({ x: 10, y: 20 });
      expect(result.uiMetadata?.nodePositions?.['page-2']).toEqual({ x: 300, y: 0 });
    });

    it('should filter out synthetic nodes when compiling back to domain story', () => {
      const result = compileGraphToStory(mockNodes as any, mockEdges as any, {});
      expect(result.pages.length).toBe(2);
      expect(result.pages.find(p => p.id === 'action-node-c2')).toBeUndefined();
    });

    it('should handle choices with missing edges gracefully', () => {
      const result = compileGraphToStory(mockNodes as any, [], {});
      expect(result.pages[0].choices![0].targetPageId).toBeUndefined();
    });
  });

  describe('parseStoryToGraph', () => {
    it('should parse pure StoryData including node positions and synthetic nodes', () => {
      const { nodes, edges } = parseStoryToGraph(expectedStoryData);

      // 2 pages + 1 synthetic action node (for choice 2 of page-1)
      expect(nodes.length).toBe(3);

      const p1Node = nodes.find(n => n.id === 'page-1');
      expect(p1Node?.position).toEqual({ x: 10, y: 20 });

      const p2Node = nodes.find(n => n.id === 'page-2');
      expect(p2Node?.position).toEqual({ x: 300, y: 0 });
      expect((p2Node?.data as any).subplotId).toBe('subplot-1');

      // Synthetic Action Node
      const actionNode = nodes.find(n => n.type === 'actionNode');
      expect(actionNode).toBeDefined();
      expect((actionNode?.data as any).choiceText).toBe('Open chest');

      // Edges: 1 real (p1->p2), 1 synthetic (p1->actionNode)
      expect(edges.length).toBe(2);
      expect(edges.some(e => e.target === 'page-2')).toBe(true);
      expect(edges.some(e => e.target === actionNode?.id && e.id.startsWith('se-'))).toBe(true);
    });

    it('should correctly generate portal nodes for subplot jumping', () => {
      const storyWithPortal: StoryData = {
        ...expectedStoryData,
        pages: [
          {
            id: 'page-1',
            title: 'Start',
            paragraphs: [],
            choices: [
              {
                id: 'c-portal',
                text: 'Enter the portal',
                actions: [{ id: 'a-p', blueprintId: 'go_to_subplot', params: { subplotId: 'subplot-1', targetPageId: 'page-2' } }]
              }
            ]
          },
          expectedStoryData.pages[1] // North Page
        ]
      };

      const { nodes, edges } = parseStoryToGraph(storyWithPortal);

      const portalNode = nodes.find(n => n.type === 'portalNode');
      expect(portalNode).toBeDefined();
      expect((portalNode?.data as any).subplotName).toBe('Cellar');
      expect((portalNode?.data as any).targetPageName).toBe('North Page');

      const portalEdge = edges.find(e => e.id === 'se-portal-c-portal');
      expect(portalEdge).toBeDefined();
      expect(portalEdge?.label).toBe('Enter the portal');
    });

    it('should provide default layout if nodePositions are missing', () => {
      const { uiMetadata, ...storyWithoutPos } = expectedStoryData;
      const { nodes } = parseStoryToGraph(storyWithoutPos);

      expect(nodes[0].position).toBeDefined();
      expect(nodes[0].position.x).toBe(0);
      expect(nodes[1].position.x).toBe(350);
    });
  });

});

