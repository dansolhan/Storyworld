import React, { useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PageNode } from './nodes/PageNode';
import { ActionNode } from './nodes/ActionNode';
import { PortalNode } from './nodes/PortalNode';
import { FloatingEdge } from './edges/FloatingEdge';
import { useEditorStore } from './store/useEditorStore';
import { EditorSidebar } from './components/EditorSidebar/EditorSidebar';
import { EditorToolbar } from './components/EditorToolbar/EditorToolbar';
import { VariableManager } from './components/VariableManager/VariableManager';
import { StorySettingsDrawer } from './components/StorySettings/StorySettingsDrawer';
import { Button } from '../../components/ui/Button/Button';
import { useInteractionStrategy } from './interactions/useInteractionStrategy';
import type { ActionNodeType } from './nodes/ActionNode';
import type { PortalNodeType } from './nodes/PortalNode';
import type { Edge } from '@xyflow/react';

import styles from './GraphEditor.module.css';

// ─── Stable node / edge type maps (must be defined outside component) ────────
const nodeTypes = {
  pageNode: PageNode,
  actionNode: ActionNode,
  portalNode: PortalNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};

const SYNTHETIC_LABEL_STYLE = {
  fontSize: 10,
  fill: 'var(--color-text-secondary, #94a3b8)',
  fontFamily: 'var(--font-family-sans, sans-serif)',
};

export const GraphEditor: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addPage,
    addParagraph,
    addChoice,
    startPageId,
    isStorySettingsOpen,
    setIsStorySettingsOpen,
    isVariableManagerOpen,
    setIsVariableManagerOpen,
    _hasHydrated,
    setSelectedPage,
    setSidebarTab,
    setCurrentPlotId,
    setIsEditorSidebarExpanded,
    syncSyntheticNodes,
  } = useEditorStore();

  const interactionStrategy = useInteractionStrategy();

  // Initialization: add one starting node if canvas is empty
  useEffect(() => {
    if (_hasHydrated && nodes.length === 0) {
      addPage(100, 100);
    }
  }, [nodes.length, addPage, _hasHydrated]);

  // ── Subplot filtering ───────────────────────────────────────────────────────
  const currentPlotId = useEditorStore((state) => state.currentPlotId);
  const subplots = useEditorStore((state) => state.subplots);

  // Split into page nodes and synthetic nodes for independent tracking
  const visiblePageNodes = useMemo(() => {
    return nodes.filter((n) =>
      n.type === 'pageNode' &&
      (currentPlotId ? n.data.subplotId === currentPlotId : !n.data.subplotId)
    );
  }, [nodes, currentPlotId]);

  const visibleSyntheticNodes = useMemo(() => {
    return nodes.filter((n) =>
      (n.type === 'actionNode' || n.type === 'portalNode') &&
      (currentPlotId
        ? (n.data as any).sourceSubplotId === currentPlotId
        : !(n.data as any).sourceSubplotId)
    );
  }, [nodes, currentPlotId]);

  const visibleNodeIds = useMemo(
    () => new Set([...visiblePageNodes, ...visibleSyntheticNodes].map((n) => n.id)),
    [visiblePageNodes, visibleSyntheticNodes]
  );

  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [edges, visibleNodeIds]
  );

  // ── Computed synthetic nodes from current page choice data ─────────────────
  // Depends ONLY on visiblePageNodes — breaks circular dependency.
  const { computedSynNodes, computedSynEdges } = useMemo(() => {
    const synNodes: (ActionNodeType | PortalNodeType)[] = [];
    const synEdges: Edge[] = [];

    visiblePageNodes.forEach((node) => {
      const choices: any[] = (node.data.choices as any[]) || [];

      choices.forEach((choice, idx) => {
        if (choice.targetPageId) return;
        const choiceActions: any[] = Array.isArray(choice.actions) ? choice.actions : [];
        if (choiceActions.length === 0) return;

        const portalAction = choiceActions.find((a: any) => a.blueprintId === 'go_to_subplot');

        if (portalAction) {
          const params = portalAction.params as Record<string, string>;
          const subplotName = subplots?.find((s) => s.id === params.subplotId)?.name || 'Unknown Subplot';
          const targetPage = nodes.find((n) => n.id === params.targetPageId);
          const targetPageName = (targetPage?.data as any)?.title || params.targetPageId || '?';
          const nodeId = `portal-node-${choice.id}`;

          synNodes.push({
            id: nodeId,
            type: 'portalNode',
            position: { x: node.position.x + 280, y: node.position.y + idx * 110 },
            width: 44,
            height: 44,
            data: {
              sourcePageId: node.id,
              subplotId: params.subplotId ?? '',
              subplotName,
              targetPageName: String(targetPageName),
            },
            selectable: true,
            draggable: true,
          } as PortalNodeType);

          synEdges.push({
            id: `se-portal-${choice.id}`,
            source: node.id,
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

          synNodes.push({
            id: nodeId,
            type: 'actionNode',
            position: { x: node.position.x + 280, y: node.position.y + idx * 110 },
            width: 44,
            height: 44,
            data: {
              sourcePageId: node.id,
              choiceId: choice.id,
              choiceText: choice.text || 'Action Choice',
              actionNames: choiceActions.map((a: any) => a.blueprintId),
            },
            selectable: true,
            draggable: true,
          } as ActionNodeType);

          synEdges.push({
            id: `se-${choice.id}-action`,
            source: node.id,
            target: nodeId,
            sourceHandle: choice.id,
            type: 'default',
            animated: true,
            label: choice.text,
            labelStyle: SYNTHETIC_LABEL_STYLE,
            labelShowBg: false,
            style: { stroke: 'var(--color-edge-default)' },
          });
        }
      });
    });

    return { computedSynNodes: synNodes, computedSynEdges: synEdges };
  }, [visiblePageNodes, subplots, nodes]);

  // ── Sync computed synthetic nodes into the store ───────────────────────────
  // useEffect so positions in the store are preserved (syncSyntheticNodes merges, not replaces)
  useEffect(() => {
    syncSyntheticNodes(computedSynNodes, computedSynEdges);
  }, [computedSynNodes, computedSynEdges, syncSyntheticNodes]);

  // ── Node handlers ──────────────────────────────────────────────────────────
  const handleAddParagraph = useCallback((id: string) => addParagraph(id), [addParagraph]);
  const handleAddChoice = useCallback((id: string) => addChoice(id), [addChoice]);

  const nodesWithHandlers = useMemo(() =>
    visiblePageNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isStartNode: node.id === startPageId,
        onAddParagraph: handleAddParagraph,
        onAddChoice: handleAddChoice,
      },
    })),
    [visiblePageNodes, startPageId, handleAddParagraph, handleAddChoice]
  );

  const allVisibleNodes = useMemo(
    () => [...nodesWithHandlers, ...visibleSyntheticNodes],
    [nodesWithHandlers, visibleSyntheticNodes]
  );

  // ── Graph event handlers ───────────────────────────────────────────────────
  const handleNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    if (node.id.startsWith('action-node-')) {
      const sn = nodes.find((n) => n.id === node.id);
      if (sn) setSelectedPage((sn.data as any).sourcePageId);
      return;
    }
    if (node.id.startsWith('portal-node-')) return; // double-click navigates
    interactionStrategy.onNodeClick(node.id);
  }, [nodes, setSelectedPage, interactionStrategy]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    if (node.id.startsWith('action-node-')) {
      const sn = nodes.find((n) => n.id === node.id);
      if (sn) {
        setSelectedPage((sn.data as any).sourcePageId);
        setSidebarTab('actions');
        setIsEditorSidebarExpanded(true);
      }
      return;
    }
    if (node.id.startsWith('portal-node-')) {
      const sn = nodes.find((n) => n.id === node.id);
      const subplotId = (sn?.data as any)?.subplotId;
      if (subplotId) setCurrentPlotId(subplotId);
      return;
    }
    interactionStrategy.onNodeDoubleClick(node.id);
  }, [nodes, setSelectedPage, setSidebarTab, setIsEditorSidebarExpanded, setCurrentPlotId, interactionStrategy]);

  const handlePaneClick = useCallback(() => {
    interactionStrategy.onPaneClick();
  }, [interactionStrategy]);

  return (
    <div className={styles.container}>
      <EditorToolbar />

      <div className={styles.flowWrapper}>
        {interactionStrategy.overlayMessage && (
          <div className={styles.selectionOverlay}>
            <p className={styles.selectionOverlayText}>
              {interactionStrategy.overlayMessage}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => interactionStrategy.onCancel()}
            >
              Cancel
            </Button>
          </div>
        )}

        <ReactFlow
          nodes={allVisibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange as any}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesConnectable={false}
          fitView
          style={{ width: '100%', height: '100%', cursor: interactionStrategy.cursor }}
        >
          <Background gap={16} color="var(--color-border-default)" />
          <Controls />
          <MiniMap zoomable pannable nodeColor="var(--color-primary-100)" />
        </ReactFlow>
      </div>

      <EditorSidebar />
      <StorySettingsDrawer isOpen={isStorySettingsOpen} onClose={() => setIsStorySettingsOpen(false)} />
      <VariableManager isOpen={isVariableManagerOpen} onClose={() => setIsVariableManagerOpen(false)} />
    </div>
  );
};
