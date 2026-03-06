import { type Edge, MarkerType } from '@xyflow/react';
import type { PageNodeType } from '../features/editor/nodes/PageNode';
import type { ActionNodeType } from '../features/editor/nodes/ActionNode';
import type { PortalNodeType } from '../features/editor/nodes/PortalNode';
import type { Choice } from '../domain/Choice/Choice';
import type { StoryData } from '../domain/Story/StoryData';
import type { Subplot } from '../domain/Story/Subplot';
import type { StoryVariable } from '../domain/Story/Variable';
import { CURRENT_VERSION } from '../domain/Story/migrations/migrations';

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
  metadata?: { title: string; description: string; startPageId: string | null }
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
      paragraphs: Array.isArray(node.data.paragraphs) ? [...node.data.paragraphs] : [],
      choices: compiledChoices,
      actions: Array.isArray(node.data.actions) ? [...node.data.actions] : [],
    };
  });

  const nodePositions: Record<string, { x: number; y: number }> = {};
  pageNodes.forEach(node => {
    nodePositions[node.id] = { x: node.position.x, y: node.position.y };
  });

  return {
    version: CURRENT_VERSION,
    pages,
    variables,
    title: metadata?.title || 'Untitled Story',
    description: metadata?.description || '',
    startPageId: metadata?.startPageId || undefined,
    uiMetadata: { nodePositions },
  };
};

// ─── Helpers for synthetic node generation ──────────────────────────────────

function buildSyntheticNodes(
  pages: StoryData['pages'],
  subplots: Subplot[],
  nodePositions: Record<string, { x: number; y: number }>,
): { nodes: (ActionNodeType | PortalNodeType)[]; edges: Edge[] } {
  const nodes: (ActionNodeType | PortalNodeType)[] = [];
  const edges: Edge[] = [];

  pages.forEach((page) => {
    const pagePos = nodePositions[page.id] || { x: 0, y: 0 };

    (page.choices || []).forEach((choice, idx) => {
      if (choice.targetPageId) return; // wired — handled as a real edge
      const choiceActions = choice.actions || [];
      if (choiceActions.length === 0) return;

      const portalAction = choiceActions.find((a) => a.blueprintId === 'go_to_subplot');

      if (portalAction) {
        const params = portalAction.params as Record<string, string>;
        const subplotName = subplots.find((s) => s.id === params.subplotId)?.name || 'Unknown Subplot';
        const targetPageName = pages.find((p) => p.id === params.targetPageId)?.title || params.targetPageId || '?';
        const nodeId = `portal-node-${choice.id}`;
        const savedPos = nodePositions[nodeId];

        nodes.push({
          id: nodeId,
          type: 'portalNode',
          position: savedPos ?? { x: pagePos.x + 280, y: pagePos.y + idx * 110 },
          width: 44,
          height: 44,
          data: {
            sourcePageId: page.id,
            subplotId: params.subplotId ?? '',
            subplotName,
            targetPageName: String(targetPageName),
          },
          selectable: true,
          draggable: true,
        } as PortalNodeType);

        edges.push({
          id: `se-portal-${choice.id}`,
          source: page.id,
          target: nodeId,
          sourceHandle: choice.id,
          type: 'default',
          animated: false,
          label: choice.text,
          labelStyle: SYNTHETIC_LABEL_STYLE,
          labelShowBg: false,
          style: { stroke: 'rgba(147,51,234,0.7)', strokeDasharray: '6 3' },
        });
      } else {
        const nodeId = `action-node-${choice.id}`;
        const savedPos = nodePositions[nodeId];

        nodes.push({
          id: nodeId,
          type: 'actionNode',
          position: savedPos ?? { x: pagePos.x + 280, y: pagePos.y + idx * 110 },
          width: 44,
          height: 44,
          data: {
            sourcePageId: page.id,
            choiceId: choice.id,
            choiceText: choice.text || 'Action Choice',
            actionNames: choiceActions.map((a) => a.blueprintId),
          },
          selectable: true,
          draggable: true,
        } as ActionNodeType);

        edges.push({
          id: `se-${choice.id}-action`,
          source: page.id,
          target: nodeId,
          sourceHandle: choice.id,
          type: 'default',
          animated: true,
          label: choice.text,
          labelStyle: SYNTHETIC_LABEL_STYLE,
          labelShowBg: false,
          style: { stroke: 'var(--color-edge-default)' },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-edge-default)' },
        });
      }
    });
  });

  return { nodes, edges };
}

/**
 * Parses a pure domain StoryData back into React Flow nodes and edges.
 * Generates PageNode, ActionNode, PortalNode entries alongside their edges.
 */
export const parseStoryToGraph = (
  storyData: StoryData,
): { nodes: AnyNode[]; edges: Edge[] } => {
  const nodes: AnyNode[] = [];
  const edges: Edge[] = [];
  const subplots: Subplot[] = storyData.subplots || [];
  const nodePositions = storyData.uiMetadata?.nodePositions || {};

  const pages = storyData.pages || [];

  pages.forEach((page, index) => {
    const savedPosition = nodePositions[page.id];
    const position = savedPosition || {
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
        paragraphs: page.paragraphs,
        choices: page.choices,
        actions: page.actions || [],
      },
    } as PageNodeType);

    // Real page-to-page edges
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

  // Synthetic nodes (ActionNode / PortalNode)
  const { nodes: synNodes, edges: synEdges } = buildSyntheticNodes(
    pages,
    subplots,
    nodePositions,
  );

  return { nodes: [...nodes, ...synNodes], edges: [...edges, ...synEdges] };
};
