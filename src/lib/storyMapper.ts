import type { Edge } from '@xyflow/react';
import type { PageNodeType } from '../features/editor/nodes/PageNode';
// import type { Page } from '../domain/Page/Page';
import type { Choice } from '../domain/Choice/Choice';
import type { StoryData } from '../domain/Story/StoryData';

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
      paragraphs: Array.isArray(node.data.paragraphs) ? [...node.data.paragraphs] : [],
      choices: compiledChoices,
    };
  });

  return {
    pages,
    variables,
    title: metadata?.title || 'Untitled Story',
    description: metadata?.description || '',
    startPageId: metadata?.startPageId || undefined,
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
    // Generate a basic grid layout since pure JSON doesn't save x/y coordinates.
    // In the true future, we might save x/y in metadata, but for now we arrange them.
    const x = (index % 4) * 350;
    const y = Math.floor(index / 4) * 400;

    nodes.push({
      id: page.id,
      type: 'pageNode',
      position: { x, y },
      data: {
        title: page.title,
        paragraphs: page.paragraphs,
        choices: page.choices,
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
            animated: true,
            style: { stroke: 'var(--color-edge-default)' },
          });
        }
      });
    }
  });

  return { nodes, edges };
};
