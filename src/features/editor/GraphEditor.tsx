import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PageNode } from './nodes/PageNode';
import { mockStory } from '../../data/mockStory';
import styles from './GraphEditor.module.css';

const nodeTypes = {
  pageNode: PageNode,
};

// Convert our mock data into React Flow nodes and edges
const generateInitialElements = () => {
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  mockStory.forEach((page, index) => {
    // Basic layout algorithm (just spread them out for now)
    const x = (index % 3) * 350;
    const y = Math.floor(index / 3) * 400;

    initialNodes.push({
      id: page.id,
      type: 'pageNode',
      position: { x, y },
      data: {
        ...page,
        onAddParagraph: (id: string) => alert(`Add paragraph to ${id}`),
        onAddChoice: (id: string) => alert(`Add choice to ${id}`),
      },
    });

    page.choices.forEach((choice) => {
      initialEdges.push({
        id: `e-${choice.id}-${choice.targetPageId}`,
        source: page.id,
        target: choice.targetPageId,
        sourceHandle: choice.id,
        animated: true,
        style: { stroke: 'var(--color-edge-default)' },
      });
    });
  });

  return { initialNodes, initialEdges };
};

const { initialNodes, initialEdges } = generateInitialElements();

export const GraphEditor: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={16} color="var(--color-border-default)" />
        <Controls />
        <MiniMap zoomable pannable nodeColor="var(--color-primary-100)" />
      </ReactFlow>
    </div>
  );
};
