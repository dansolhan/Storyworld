import type { EditorNode } from '../store/editorTypes';
import type { Edge } from '@xyflow/react';

export function updateGraphVisibility(nodes: EditorNode[], edges: Edge[], currentPlotId: string | null) {
  let nodesChanged = false;
  const nextNodes = nodes.map(n => {
    let isVisible = false;
    if (n.type === 'pageNode') {
      isVisible = currentPlotId ? n.data.subplotId === currentPlotId : !n.data.subplotId;
    } else if (n.type === 'actionNode' || n.type === 'portalNode') {
      isVisible = currentPlotId ? (n.data as any).sourceSubplotId === currentPlotId : !(n.data as any).sourceSubplotId;
    }

    const hidden = !isVisible;
    if (n.hidden !== hidden) {
      nodesChanged = true;
      return { ...n, hidden };
    }
    return n;
  });

  const visibleNodeIds = new Set(nextNodes.filter(n => !n.hidden).map(n => n.id));

  let edgesChanged = false;
  const nextEdges = edges.map(e => {
    const isVisible = visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target);
    const hidden = !isVisible;
    if (e.hidden !== hidden) {
      edgesChanged = true;
      return { ...e, hidden };
    }
    return e;
  });

  return {
    nodes: nodesChanged ? nextNodes : nodes,
    edges: edgesChanged ? nextEdges : edges
  };
}
