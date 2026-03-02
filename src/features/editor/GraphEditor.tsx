import React, { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PageNode } from './nodes/PageNode';
import { useEditorStore } from './store/useEditorStore';
import { EditorSidebar } from './components/EditorSidebar/EditorSidebar';
import { EditorToolbar } from './components/EditorToolbar/EditorToolbar';
import { VariableManager } from './components/VariableManager/VariableManager';
import { StorySettingsDrawer } from './components/StorySettings/StorySettingsDrawer';
import { Button } from '../../components/ui/Button/Button';
import { useInteractionStrategy } from './interactions/useInteractionStrategy';

import styles from './GraphEditor.module.css';

const nodeTypes = {
  pageNode: PageNode,
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
  } = useEditorStore();

  const interactionStrategy = useInteractionStrategy();

  // Initialization: Just add one starting node if the canvas is completely empty.
  // In a real app we'd load a saved project here.
  useEffect(() => {
    if (nodes.length === 0) {
      addPage(100, 100);
    }
  }, [nodes.length, addPage]);

  // We wrap the add actions so they are compatible with the Node data interface
  const handleAddParagraph = (id: string) => addParagraph(id);
  const handleAddChoice = (id: string) => addChoice(id);

  // We have to inject these domain handlers into the React Flow nodes
  const nodesWithHandlers = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      isStartNode: node.id === startPageId,
      onAddParagraph: handleAddParagraph,
      onAddChoice: handleAddChoice,
    }
  }));



  // React Flow Handlers bound to the strategy
  const handleNodeClick = (_: React.MouseEvent, node: { id: string }) => {
    interactionStrategy.onNodeClick(node.id);
  };

  const handlePaneClick = () => {
    interactionStrategy.onPaneClick();
  };

  return (
    <div className={styles.container}>
      {/* Left Panel */}
      <EditorToolbar />

      <div className={styles.flowWrapper}>
        {/* Selection Overlay */}
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
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          style={{ width: '100%', height: '100%', cursor: interactionStrategy.cursor }}
        >
          <Background gap={16} color="var(--color-border-default)" />
          <Controls />
          <MiniMap zoomable pannable nodeColor="var(--color-primary-100)" />
        </ReactFlow>
      </div>

      {/* Right Panels */}
      <EditorSidebar />
      <StorySettingsDrawer isOpen={isStorySettingsOpen} onClose={() => setIsStorySettingsOpen(false)} />
      <VariableManager isOpen={isVariableManagerOpen} onClose={() => setIsVariableManagerOpen(false)} />
    </div>
  );
};
