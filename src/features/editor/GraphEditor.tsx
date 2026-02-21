import React, { useEffect, useState } from 'react';
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
  } = useEditorStore();


  const [isVariableManagerOpen, setIsVariableManagerOpen] = useState(false);

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
      onAddParagraph: handleAddParagraph,
      onAddChoice: handleAddChoice,
    }
  }));



  const { setSelectedPage } = useEditorStore();

  const handleNodeClick = (_: React.MouseEvent, node: { id: string }) => {
    setSelectedPage(node.id);
  };

  const handlePaneClick = () => {
    setSelectedPage(null);
  };

  return (
    <div className={styles.container}>
      {/* Editor Toolbar */}
      <EditorToolbar onOpenVariableManager={() => setIsVariableManagerOpen(true)} />

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
      >
        <Background gap={16} color="var(--color-border-default)" />
        <Controls />
        <MiniMap zoomable pannable nodeColor="var(--color-primary-100)" />
      </ReactFlow>

      {/* Contextual Editor Sidebar */}
      <EditorSidebar />

      {/* Global Variables Manager */}
      <VariableManager isOpen={isVariableManagerOpen} onClose={() => setIsVariableManagerOpen(false)} />
    </div>
  );
};
