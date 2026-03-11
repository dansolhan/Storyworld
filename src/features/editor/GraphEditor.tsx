import React, { useEffect, useCallback } from 'react';
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

export const GraphEditor: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addPage,
    isStorySettingsOpen,
    setIsStorySettingsOpen,
    isVariableManagerOpen,
    setIsVariableManagerOpen,
    isAtmosphereManagerOpen,
    setIsAtmosphereManagerOpen,
    isItemManagerOpen,
    setIsItemManagerOpen,
    _hasHydrated,
    setSelectedPage,
    setSidebarTab,
    setCurrentPlotId,
    setIsEditorSidebarExpanded,
  } = useEditorStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addPage: state.addPage,
      isStorySettingsOpen: state.isStorySettingsOpen,
      setIsStorySettingsOpen: state.setIsStorySettingsOpen,
      isVariableManagerOpen: state.isVariableManagerOpen,
      setIsVariableManagerOpen: state.setIsVariableManagerOpen,
      isAtmosphereManagerOpen: state.isAtmosphereManagerOpen,
      setIsAtmosphereManagerOpen: state.setIsAtmosphereManagerOpen,
      isItemManagerOpen: state.isItemManagerOpen,
      setIsItemManagerOpen: state.setIsItemManagerOpen,
      _hasHydrated: state._hasHydrated,
      setSelectedPage: state.setSelectedPage,
      setSidebarTab: state.setSidebarTab,
      setCurrentPlotId: state.setCurrentPlotId,
      setIsEditorSidebarExpanded: state.setIsEditorSidebarExpanded,
    }))
  );

  const interactionStrategy = useInteractionStrategy();

  // Initialization: add one starting node if canvas is empty
  useEffect(() => {
    if (_hasHydrated && nodes.length === 0) {
      addPage(100, 100);
    }
  }, [nodes.length, addPage, _hasHydrated]);

  // ── Subplot filtering is now handled purely via .hidden flags natively in React Flow ──

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
          nodes={nodes}
          edges={edges}
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
      <ItemManager isOpen={isItemManagerOpen} onClose={() => setIsItemManagerOpen(false)} />
      <VariableManager isOpen={isVariableManagerOpen} onClose={() => setIsVariableManagerOpen(false)} />
      <AtmosphereManager isOpen={isAtmosphereManagerOpen} onClose={() => setIsAtmosphereManagerOpen(false)} />
      <AudioManagerModal />
    </div>
  );
};
