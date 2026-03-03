import { type Edge, MarkerType } from '@xyflow/react';
import type { PageNodeType } from '../features/editor/nodes/PageNode';
// import type { Page } from '../domain/Page/Page';
import type { Choice } from '../domain/Choice/Choice';
import type { StoryData } from '../domain/Story/StoryData';
import { CURRENT_VERSION } from '../domain/Story/migrations/migrations';

/**
 * Compiles the raw React Flow nodes and edges back into our pure domain Page[] array.
 * This effectively strips out all Editor-specific UI data (like x/y positions)
 * and resolves the graph edges into the targetPageId string properties.
 */
export const compileGraphToStory = (
  nodes: PageNodeType[],
  edges: Edge[],
  variables: Record<string, string>,
  metadata?: { title: string; description: string; startPageId: string | null }
): StoryData => {
  const pages = nodes.map((node) => {
    // Reconstruct Choices by finding any React Flow edges where this node is the source.
    // We map the choice.id to the edge's sourceHandle to figure out where it points.
    const compiledChoices: Choice[] = (node.data.choices || []).map((choice) => {
      // Find an edge that originates from this specific choice handle
      const connectingEdge = edges.find(
        (e) => e.source === node.id && e.sourceHandle === choice.id
      );

      return {
        ...choice,
        // If an edge exists, set the targetPageId. Otherwise leave empty.
        targetPageId: connectingEdge ? connectingEdge.target : '',
      };
    });

    return {
      id: node.id,
      title: node.data.title as string || 'Untitled',
      subplotId: node.data.subplotId as string | undefined,
      paragraphs: Array.isArray(node.data.paragraphs) ? [...node.data.paragraphs] : [],
      choices: compiledChoices,
      actions: Array.isArray(node.data.actions) ? [...node.data.actions] : [],
    };
  });

  const nodePositions: Record<string, { x: number; y: number }> = {};
  nodes.forEach(node => {
    nodePositions[node.id] = { x: node.position.x, y: node.position.y };
  });

  return {
    version: CURRENT_VERSION,
    pages,
    variables,
    title: metadata?.title || 'Untitled Story',
    description: metadata?.description || '',
    startPageId: metadata?.startPageId || undefined,
    uiMetadata: {
      nodePositions,
    }
  };
};

/**
 * Parses a pure domain Page[] array back into React Flow nodes and edges.
 * Used for importing a saved JSON or .storyworld file back into the Editor.
 */
export const parseStoryToGraph = (storyData: StoryData): { nodes: PageNodeType[], edges: Edge[] } => {
  const nodes: PageNodeType[] = [];
  const edges: Edge[] = [];

  const pages = storyData.pages || [];

  pages.forEach((page, index) => {
    // Read the saved x/y coordinate, or fallback to a basic grid layout if it doesn't exist.
    const savedPosition = storyData.uiMetadata?.nodePositions?.[page.id];
    const position = savedPosition || {
      x: (index % 4) * 350,
      y: Math.floor(index / 4) * 400
    };

    nodes.push({
      id: page.id,
      type: 'pageNode',
      position,
      data: {
        title: page.title,
        subplotId: page.subplotId,
        paragraphs: page.paragraphs,
        choices: page.choices,
        actions: page.actions || [],
      }
    });

    // Reconstruct the edges for choices
    if (page.choices) {
      page.choices.forEach((choice) => {
        if (choice.targetPageId) {
          edges.push({
            id: `e-${choice.id}-${choice.targetPageId}`,
            source: page.id,
            target: choice.targetPageId,
            sourceHandle: choice.id,
            type: 'floating',
            animated: true,
            style: { stroke: 'var(--color-edge-default)' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'var(--color-edge-default)'
            }
          });
        }
      });
    }
  });

  return { nodes, edges };
};
