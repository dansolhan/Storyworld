import { MarkerType, type Edge } from '@xyflow/react';
import type { EditorNode } from '../store/editorTypes';
import type { Subplot } from '../../../domain/Story/Subplot';
import type { ActionNodeType } from '../nodes/ActionNode';
import type { PortalNodeType } from '../nodes/PortalNode';
import type { PageNodeType } from '../nodes/PageNode';
import type { Page } from '../../../domain/Page/Page';
import { updateGraphVisibility } from './visibility';

const SYNTHETIC_LABEL_STYLE = {
  fontSize: 10,
  fill: 'var(--color-text-dim, #a49c90)',
  fontFamily: 'var(--font-body, serif)',
};

export function syncSyntheticNodes(
  allNodes: EditorNode[],
  allEdges: Edge[],
  pages: Record<string, Page>,
  subplots: Subplot[],
  currentPlotId: string | null
): { nodes: EditorNode[]; edges: Edge[] } {
  const realEdges = allEdges.filter((e) => !e.id.startsWith('se-'));

  // 1. Filter and Sync Page Nodes
  const pageNodes = allNodes
    .filter((n): n is PageNodeType => n.type === 'pageNode')
    .map((n) => {
      const pageDomain = pages[n.id];
      if (!pageDomain) return n;

      // Ensure the node data is fully synced with the domain model
      return {
        ...n,
        data: {
          ...n.data,
          title: pageDomain.title,
          type: pageDomain.type,
          paragraphs: pageDomain.paragraphs,
          choices: pageDomain.choices,
          actions: pageDomain.actions, // Added missing actions sync
          subplotId: pageDomain.subplotId,
          atmosphereId: pageDomain.atmosphereId,
        },
      };
    });

  // 2. Track positions of existing synthetic nodes
  const existingPositions: Record<string, { x: number; y: number }> = {};
  allNodes.forEach((n) => {
    if (n.type === 'actionNode' || n.type === 'portalNode') {
      existingPositions[n.id] = n.position;
    }
  });

  const synNodes: (ActionNodeType | PortalNodeType)[] = [];
  const synEdges: Edge[] = [];

  pageNodes.forEach((page) => {
    const pagePos = page.position;
    const pageDomain = pages[page.id];
    if (!pageDomain) return;

    (pageDomain.choices || []).forEach((choice) => {
      if (choice.targetPageId) return; // connected to a real page

      const choiceActions = Array.isArray(choice.actions) ? choice.actions : [];
      if (choiceActions.length === 0) return;

      const portalAction = choiceActions.find((a) => a.blueprintId === 'go_to_subplot');

      if (portalAction) {
        const params = portalAction.params as Record<string, string>;
        const subplotName = subplots.find((s) => s.id === params.subplotId)?.name || 'Unknown Subplot';

        const targetPage = pages[params.targetPageId];
        const targetPageName = targetPage?.title || params.targetPageId || '?';
        const nodeId = `portal-node-${choice.id}`;

        // Calculate a centered horizontal offset above the node
        const choiceIdx = (pageDomain.choices || []).indexOf(choice);
        const totalChoices = (pageDomain.choices || []).filter((c) => !c.targetPageId).length;
        const hOffset = (choiceIdx - (totalChoices - 1) / 2) * 80;

        synNodes.push({
          id: nodeId,
          type: 'portalNode',
          position: existingPositions[nodeId] || { x: pagePos.x + hOffset, y: pagePos.y - 120 },
          width: 44,
          height: 44,
          data: {
            sourcePageId: page.id,
            sourceSubplotId: page.data.subplotId,
            subplotId: params.subplotId ?? '',
            subplotName,
            targetPageName: String(targetPageName),
          },
          selectable: true,
          draggable: true,
        } as PortalNodeType);

        synEdges.push({
          id: `se-portal-${choice.id}`,
          source: page.id,
          target: nodeId,
          sourceHandle: choice.id,
          type: 'floating',
          animated: false,
          label: choice.text,
          labelStyle: SYNTHETIC_LABEL_STYLE,
          labelShowBg: false,
          style: { stroke: 'rgba(147,51,234,0.7)', strokeDasharray: '6 3' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'rgba(147,51,234,0.7)'
          }
        });
      } else {
        const nodeId = `action-node-${choice.id}`;

        const choiceIdx = (pageDomain.choices || []).indexOf(choice);
        const totalChoices = (pageDomain.choices || []).filter((c) => !c.targetPageId).length;
        const hOffset = (choiceIdx - (totalChoices - 1) / 2) * 80;

        synNodes.push({
          id: nodeId,
          type: 'actionNode',
          position: existingPositions[nodeId] || { x: pagePos.x + hOffset, y: pagePos.y - 120 },
          width: 44,
          height: 44,
          data: {
            sourcePageId: page.id,
            sourceSubplotId: page.data.subplotId,
            choiceId: choice.id,
            choiceText: choice.text || 'Action Choice',
            actionNames: choiceActions.map((a) => a.blueprintId),
          },
          selectable: true,
          draggable: true,
        } as ActionNodeType);

        synEdges.push({
          id: `se-${choice.id}-action`,
          source: page.id,
          target: nodeId,
          sourceHandle: choice.id,
          type: 'floating',
          animated: false,
          label: choice.text,
          labelStyle: SYNTHETIC_LABEL_STYLE,
          labelShowBg: false,
          style: { stroke: 'var(--color-edge-default)' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--color-edge-default)'
          }
        });
      }
    });
  });

  const combinedNodes = [...pageNodes, ...synNodes];
  const combinedEdges = [...realEdges, ...synEdges];

  return updateGraphVisibility(combinedNodes, combinedEdges, currentPlotId);
}
