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
import { AudioManagerModal } from './components/Audio/AudioManagerModal';
import { AtmosphereManager } from './components/AtmosphereManager/AtmosphereManager';
import { ItemManager } from './components/ItemManager/ItemManager';
import { StatusDataManager } from './components/StatusDataManager/StatusDataManager';
import { Button } from '../../components/ui/Button/Button';
import { useInteractionStrategy } from './interactions/useInteractionStrategy';
import { useShallow } from 'zustand/react/shallow';

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

// ─── FlowView Component (Isolated Graph Rendering) ──────────────────────────
const FlowView: React.FC = React.memo(() => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedPage,
    setSidebarTab,
    setCurrentPlotId,
    setIsEditorSidebarExpanded,
    setIsDragging,
    setIsPanning,
    isDragging
  } = useEditorStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      setSelectedPage: state.setSelectedPage,
      setSidebarTab: state.setSidebarTab,
      setCurrentPlotId: state.setCurrentPlotId,
      setIsEditorSidebarExpanded: state.setIsEditorSidebarExpanded,
      setIsDragging: state.setIsDragging,
      setIsPanning: state.setIsPanning,
      isDragging: state.isDragging
    }))
  );

  const interactionStrategy = useInteractionStrategy();

  // ── Stable style objects ───────────────────────────────────────────────────
  const flowStyle = useMemo(() => ({ width: '100%', height: '100%', cursor: interactionStrategy.cursor }), [interactionStrategy.cursor]);

  // ── Graph event handlers ───────────────────────────────────────────────────
  const onNodeDragStart = useCallback(() => setIsDragging(true), [setIsDragging]);
  const onNodeDragStop = useCallback(() => setIsDragging(false), [setIsDragging]);
  const onMoveStart = useCallback(() => setIsPanning(true), [setIsPanning]);
  const onMoveEnd = useCallback(() => setIsPanning(false), [setIsPanning]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    if (node.id.startsWith('action-node-')) {
      setSelectedPage(node.data.sourcePageId);
      return;
    }
    if (node.id.startsWith('portal-node-')) return; 
    interactionStrategy.onNodeClick(node.id);
  }, [setSelectedPage, interactionStrategy]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: any) => {
    if (node.id.startsWith('action-node-')) {
      setSelectedPage(node.data.sourcePageId);
      setSidebarTab('actions');
      setIsEditorSidebarExpanded(true);
      return;
    }
    if (node.id.startsWith('portal-node-')) {
      const subplotId = node.data.subplotId;
      if (subplotId) setCurrentPlotId(subplotId);
      return;
    }
    interactionStrategy.onNodeDoubleClick(node.id);
  }, [setSelectedPage, setSidebarTab, setIsEditorSidebarExpanded, setCurrentPlotId, interactionStrategy]);

  const handlePaneClick = useCallback(() => {
    interactionStrategy.onPaneClick();
  }, [interactionStrategy]);

  return (
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as any}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onMoveStart={onMoveStart}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesConnectable={false}
        onlyRenderVisibleElements={true}
        nodeDragThreshold={3}
        snapToGrid={true}
        snapGrid={[20, 20]}
        minZoom={0.2}
        maxZoom={4}
        fitView
        style={flowStyle}
      >
        <Background gap={16} color="var(--color-border-default)" />
        <Controls />
        {!isDragging && <MiniMap zoomable pannable nodeColor="var(--color-primary-100)" />}
      </ReactFlow>
    </div>
  );
});

// ─── Main GraphEditor (Stable Outer Shell) ──────────────────────────────────
export const GraphEditor: React.FC = () => {
  const {
    isStorySettingsOpen,
    setIsStorySettingsOpen,
    isVariableManagerOpen,
    setIsVariableManagerOpen,
    isAtmosphereManagerOpen,
    setIsAtmosphereManagerOpen,
    isItemManagerOpen,
    setIsItemManagerOpen,
    isStatusDataManagerOpen,
    setIsStatusDataManagerOpen,
    _hasHydrated,
    nodesCount,
    addPage
  } = useEditorStore(
    useShallow((state) => ({
      isStorySettingsOpen: state.isStorySettingsOpen,
      setIsStorySettingsOpen: state.setIsStorySettingsOpen,
      isVariableManagerOpen: state.isVariableManagerOpen,
      setIsVariableManagerOpen: state.setIsVariableManagerOpen,
      isAtmosphereManagerOpen: state.isAtmosphereManagerOpen,
      setIsAtmosphereManagerOpen: state.setIsAtmosphereManagerOpen,
      isItemManagerOpen: state.isItemManagerOpen,
      setIsItemManagerOpen: state.setIsItemManagerOpen,
      isStatusDataManagerOpen: state.isStatusDataManagerOpen,
      setIsStatusDataManagerOpen: state.setIsStatusDataManagerOpen,
      _hasHydrated: state._hasHydrated,
      nodesCount: state.nodes.length,
      addPage: state.addPage,
    }))
  );

  // Initialization: add one starting node if canvas is empty
  useEffect(() => {
    if (_hasHydrated && nodesCount === 0) {
      addPage(100, 100);
    }
  }, [nodesCount, addPage, _hasHydrated]);

  const closeStorySettings = useCallback(() => setIsStorySettingsOpen(false), [setIsStorySettingsOpen]);
  const closeItemManager = useCallback(() => setIsItemManagerOpen(false), [setIsItemManagerOpen]);
  const closeStatusDataManager = useCallback(() => setIsStatusDataManagerOpen(false), [setIsStatusDataManagerOpen]);
  const closeVariableManager = useCallback(() => setIsVariableManagerOpen(false), [setIsVariableManagerOpen]);
  const closeAtmosphereManager = useCallback(() => setIsAtmosphereManagerOpen(false), [setIsAtmosphereManagerOpen]);

  return (
    <div className={styles.container}>
      <EditorToolbar />
      <FlowView />
      <EditorSidebar />
      <StorySettingsDrawer isOpen={isStorySettingsOpen} onClose={closeStorySettings} />
      <ItemManager isOpen={isItemManagerOpen} onClose={closeItemManager} />
      <StatusDataManager isOpen={isStatusDataManagerOpen} onClose={closeStatusDataManager} />
      <VariableManager isOpen={isVariableManagerOpen} onClose={closeVariableManager} />
      <AtmosphereManager isOpen={isAtmosphereManagerOpen} onClose={closeAtmosphereManager} />
      <AudioManagerModal />
    </div>
  );
};
