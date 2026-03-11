import { type Edge, MarkerType } from '@xyflow/react';
import type { PageNodeType } from '../features/editor/nodes/PageNode';
import type { ActionNodeType } from '../features/editor/nodes/ActionNode';
import type { PortalNodeType } from '../features/editor/nodes/PortalNode';
import type { Choice } from '../domain/Choice/Choice';
import type { StoryData } from '../domain/Story/StoryData';
import type { StoryVariable } from '../domain/Story/Variable';
import type { AudioItem } from '../domain/Story/Audio';
import type { Item } from '../domain/Item/Item';
import { CURRENT_VERSION } from '../domain/Story/migrations/migrations';
import { syncSyntheticNodes } from '../features/editor/utils/syncSyntheticNodes';

type AnyNode = PageNodeType | ActionNodeType | PortalNodeType;

const SYNTHETIC_LABEL_STYLE = {
  fontSize: 10,
  fill: 'var(--color-text-secondary, #94a3b8)',
  fontFamily: 'var(--font-family-sans, sans-serif)',
};

/**
 * Compiles the raw React Flow nodes and edges back into our pure domain Page[] array.
 * Filters out synthetic ActionNode / PortalNode entries — only pageNode types are saved.
 */
export const compileGraphToStory = (
  nodes: AnyNode[],
  edges: Edge[],
  variables: Record<string, StoryVariable>,
  items?: Record<string, Item>,
  metadata?: { title: string; description: string; startPageId: string | null },
  audio?: Record<string, AudioItem>,
  atmospheres?: Record<string, import('../domain/Atmosphere/Atmosphere').Atmosphere>
): StoryData => {
  const pageNodes = nodes.filter((n): n is PageNodeType => n.type === 'pageNode');

  const pages = pageNodes.map((node) => {
    const compiledChoices: Choice[] = (node.data.choices || []).map((choice) => {
      const connectingEdge = edges.find(
        (e) => e.source === node.id && e.sourceHandle === choice.id
      );

      const result: Choice = { ...choice };
      if (connectingEdge && !connectingEdge.id.startsWith('se-')) {
        // Only use real page-to-page edges (synthetic edges start with 'se-')
        result.targetPageId = connectingEdge.target;
      } else {
        delete result.targetPageId;
      }
      return result;
    });

    return {
      id: node.id,
      title: node.data.title as string || 'Untitled',
      subplotId: node.data.subplotId as string | undefined,
      atmosphereId: node.data.atmosphereId as string | undefined,
      paragraphs: Array.isArray(node.data.paragraphs) ? [...node.data.paragraphs] : [],
      choices: compiledChoices,
      actions: Array.isArray(node.data.actions) ? [...node.data.actions] : [],
    };
  });

  return {
    version: CURRENT_VERSION,
    pages,
    variables,
    items,
    audio,
    atmospheres,
    title: metadata?.title || 'Untitled Story',
    description: metadata?.description || '',
    startPageId: metadata?.startPageId || undefined,
    uiMetadata: { nodes, edges }, // Save the entire raw graph
  };
};

/**
 * Parses a pure domain StoryData back into React Flow nodes and edges.
 * If nodes and edges exist in uiMetadata, it loads them directly.
 * Otherwise, it falls back to generating a grid of pageNodes.
 */
export const parseStoryToGraph = (
  storyData: StoryData,
): { nodes: AnyNode[]; edges: Edge[] } => {

  if (storyData.uiMetadata?.nodes && storyData.uiMetadata?.edges) {
    return {
      nodes: storyData.uiMetadata.nodes,
      edges: storyData.uiMetadata.edges
    };
  }

  // Fallback for older save files without uiMetadata.nodes
  const nodes: AnyNode[] = [];
  const edges: Edge[] = [];
  const pages = storyData.pages || [];

  pages.forEach((page, index) => {
    const position = {
      x: (index % 4) * 350,
      y: Math.floor(index / 4) * 400,
    };

    nodes.push({
      id: page.id,
      type: 'pageNode',
      position,
      data: {
        title: page.title,
        subplotId: page.subplotId,
        atmosphereId: page.atmosphereId,
        paragraphs: page.paragraphs,
        choices: page.choices,
        actions: page.actions || [],
      },
    } as PageNodeType);

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
            label: choice.text,
            labelStyle: SYNTHETIC_LABEL_STYLE,
            labelShowBg: false,
            style: { stroke: 'var(--color-edge-default)' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'var(--color-edge-default)',
            },
          });
        }
      });
    }
  });

  const synced = syncSyntheticNodes(nodes, edges, storyData.subplots || [], null);
  return { nodes: synced.nodes as AnyNode[], edges: synced.edges };
};
