import { describe, it, expect } from 'vitest';
import { compileGraphToStory, parseStoryToGraph } from './storyMapper';
import type { PageNodeType } from '../features/editor/nodes/PageNode';
import type { StoryData } from '../domain/Story/StoryData';

describe('storyMapper', () => {

  const mockVariables = { keyOpen: 'false' };

  const mockNodes: PageNodeType[] = [
    {
      id: 'page-1',
      type: 'pageNode',
      position: { x: 0, y: 0 },
      data: {
        title: 'Start Page',
        paragraphs: [{ id: 'p1', text: 'Hello' }],
        choices: [{ id: 'c1', text: 'Go north', targetPageId: '' }]
      }
    },
    {
      id: 'page-2',
      type: 'pageNode',
      position: { x: 300, y: 0 },
      data: {
        title: 'North Page',
        paragraphs: [],
        choices: []
      }
    }
  ];

  const mockEdges = [
    {
      id: 'e-c1-page-2',
      source: 'page-1',
      target: 'page-2',
      sourceHandle: 'c1'
    }
  ];

  const expectedStoryData: StoryData = {
    title: 'Test Story',
    description: 'A story for testing mapping',
    startPageId: 'page-1',
    variables: mockVariables,
    pages: [
      {
        id: 'page-1',
        title: 'Start Page',
        paragraphs: [{ id: 'p1', text: 'Hello' }],
        choices: [{ id: 'c1', text: 'Go north', targetPageId: 'page-2' }]
      },
      {
        id: 'page-2',
        title: 'North Page',
        paragraphs: [],
        choices: []
      }
    ]
  };

  describe('compileGraphToStory', () => {
    it('should correctly map React Flow nodes and edges into pure StoryData', () => {
      const result = compileGraphToStory(
        mockNodes,
        mockEdges,
        mockVariables,
        { title: 'Test Story', description: 'A story for testing mapping', startPageId: 'page-1' }
      );

      // Verify page properties
      expect(result.pages.length).toBe(2);
      expect(result.pages[0].id).toBe('page-1');
      expect(result.pages[0].title).toBe('Start Page');

      // Verify edge mapping into choices targetPageId
      expect(result.pages[0].choices![0].targetPageId).toBe('page-2'); // Edge successfully converted

      // Verify metadata mapping
      expect(result.title).toBe('Test Story');
      expect(result.description).toBe('A story for testing mapping');
      expect(result.startPageId).toBe('page-1');
    });

    it('should handle choices with missing edges gracefully', () => {
      // Pass empty edges array to see if choices fallback to '' targetPageId
      const result = compileGraphToStory(mockNodes, [], mockVariables);
      expect(result.pages[0].choices![0].targetPageId).toBe('');
    });
  });

  describe('parseStoryToGraph', () => {
    it('should parse pure StoryData back into nodes and correctly linked edges', () => {
      const { nodes, edges } = parseStoryToGraph(expectedStoryData);

      // Verify nodes reconstructed
      expect(nodes.length).toBe(2);
      expect(nodes[0].data.title).toBe('Start Page');
      expect(nodes[0].position).toBeDefined(); // Layout generator should have seeded x/y

      // Verify edges reconstructed based on choice targets
      expect(edges.length).toBe(1);
      expect(edges[0].source).toBe('page-1');
      expect(edges[0].target).toBe('page-2');
      expect(edges[0].sourceHandle).toBe('c1');
    });

    it('should not create edges for choices lacking a targetPageId', () => {
      const incompleteStoryData = {
        ...expectedStoryData,
        pages: [
          {
            id: 'page-1',
            title: 'Start Page',
            paragraphs: [],
            choices: [{ id: 'c1', text: 'Unconnected', targetPageId: '' }] // Missing target
          }
        ]
      };

      const { edges } = parseStoryToGraph(incompleteStoryData);
      expect(edges.length).toBe(0); // Should yield exactly 0 edges
    });
  });

});
