import React, { useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PageNode } from './nodes/PageNode';
import { useEditorStore } from './store/useEditorStore';
import { compileGraphToStory, parseStoryToGraph } from '../../lib/storyMapper';
import { exportToJson, exportToStoryworld } from '../../utils/exportUtils';
import { Button } from '../../components/ui/Button/Button';
import { EditorSidebar } from './components/EditorSidebar/EditorSidebar';
import { VariableManager } from './components/VariableManager/VariableManager';
import type { StoryData } from '../../domain/Story/StoryData';
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
    loadStory,
    variables
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleExportJson = () => {
    const storyData = compileGraphToStory(nodes, edges, variables);
    exportToJson(storyData);
  };

  const handleExportStoryworld = () => {
    const storyData = compileGraphToStory(nodes, edges, variables);
    exportToStoryworld(storyData);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData: StoryData = JSON.parse(content);

        // Simplistic validation to ensure it's our graph format
        if (parsedData && Array.isArray(parsedData.pages) && parsedData.pages.length > 0 && 'id' in parsedData.pages[0]) {
          const { nodes: parsedNodes, edges: parsedEdges } = parseStoryToGraph(parsedData);
          loadStory(parsedNodes, parsedEdges, parsedData.variables || {});
        } else {
          alert("Invalid story format.");
        }
      } catch (error) {
        console.error("Error parsing file", error);
        alert("Failed to parse the file.");
      }

      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAddNewPage = () => {
    // Determine a dynamic position to drop the new node (a bit chaotic currently, but it works)
    const x = Math.random() * 400;
    const y = Math.random() * 400;
    addPage(x, y);
  };

  const { setSelectedPage } = useEditorStore();

  const handleNodeClick = (_: React.MouseEvent, node: { id: string }) => {
    setSelectedPage(node.id);
  };

  const handlePaneClick = () => {
    setSelectedPage(null);
  };

  return (
    <div className={styles.container}>
      {/* Hidden file input for importing */}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Editor Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Button variant="primary" size="sm" onClick={handleAddNewPage}>
            + Add Page Node
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsVariableManagerOpen(true)}>
            Variables
          </Button>
        </div>
        <div className={styles.toolbarGroup}>
          <Button variant="secondary" size="sm" onClick={handleImportClick}>
            Import JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportJson}>
            Export to JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportStoryworld}>
            Export to .storyworld
          </Button>
        </div>
      </div>

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
