import React from "react";
import { ReactFlow, Background, Controls, MiniMap, Panel } from "@xyflow/react";
import { Wand2 } from "lucide-react";
import { useNodes } from "../../hooks/graph/useNodes";
import { useEdges } from "../../hooks/graph/useEdges";
import { useGraphHandlers } from "../../hooks/graph/useGraphHandlers";
import { useInteractionState } from "../../hooks/view/useInteractionState";
import { useFlowInteraction } from "../../hooks/useFlowInteraction";
import { useEditorStore } from "../../store/useEditorStore";
import { PageNode } from "../../nodes/PageNode";
import { ActionNode } from "../../nodes/ActionNode";
import { PortalNode } from "../../nodes/PortalNode";
import { FloatingEdge } from "../../edges/FloatingEdge";
import { EdgeMarkers } from "../../edges/EdgeMarkers";
import { EdgePairProvider, buildEdgePairMap } from "../../edges/edgePairs";
import { Button } from "../../../../components/ui/Button/Button";

import styles from "../../GraphEditor.module.css";

const nodeTypes = {
  pageNode: PageNode,
  actionNode: ActionNode,
  portalNode: PortalNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};

export const FlowView: React.FC = React.memo(() => {
  const nodes = useNodes();
  const edges = useEdges();
  const { onNodesChange, onEdgesChange, onConnect } = useGraphHandlers();
  const { isDragging } = useInteractionState();

  const {
    interactionStrategy,
    onNodeDragStart,
    onNodeDragStop,
    onMoveStart,
    onMoveEnd,
    handleNodeClick,
    handleNodeDoubleClick,
    handlePaneClick,
  } = useFlowInteraction();

  const organizeGraph = useEditorStore((state) => state.organizeGraph);

  const edgePairMap = React.useMemo(() => buildEdgePairMap(edges), [edges]);

  const flowStyle = React.useMemo(
    () => ({
      width: "100%",
      height: "100%",
      cursor: interactionStrategy.cursor,
    }),
    [interactionStrategy.cursor],
  );

  return (
    <div className={styles.flowWrapper}>
      <EdgeMarkers />
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

      <EdgePairProvider value={edgePairMap}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
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
        <Background gap={24} size={1} color="var(--color-canvas-dot)" />
        <Controls />
        {!isDragging && (
          <MiniMap zoomable pannable nodeColor="var(--color-accent-line)" />
        )}

        <Panel position="top-right" className={styles.flowPanel}>
          <Button
            variant="secondary"
            size="sm"
            onClick={organizeGraph}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Wand2 size={16} />
            Organize Graph
          </Button>
        </Panel>
      </ReactFlow>
      </EdgePairProvider>
    </div>
  );
});
