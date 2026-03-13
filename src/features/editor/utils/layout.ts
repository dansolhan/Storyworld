import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 220; // 200px + margin
const NODE_HEIGHT = 180; // ~150px + margin

// Layout Spaging Constants
const LAYOUT_MIN_ROW_HEIGHT = 300;
const LAYOUT_BASE_ROW_HEIGHT = 200;
const LAYOUT_ROW_DENSITY_FACTOR = 50;

const LAYOUT_MIN_COL_WIDTH = 500;
const LAYOUT_BASE_COL_WIDTH = 350;
const LAYOUT_COL_DENSITY_FACTOR = 50;

/**
 * Checks if a proposed position for a new node collides with any existing nodes.
 */
function isColliding(x: number, y: number, nodes: Node[]): boolean {
  return nodes.some(node => {
    const nx = node.position.x;
    const ny = node.position.y;

    // A simple bounding box check
    return (
      x < nx + NODE_WIDTH &&
      x + NODE_WIDTH > nx &&
      y < ny + NODE_HEIGHT &&
      y + NODE_HEIGHT > ny
    );
  });
}

/**
 * Finds the first available spot for a new node by searching in a growing spiral
 * starting from a base position.
 */
export function findSmartNodePosition(nodes: Node[], baseX: number, baseY: number): { x: number, y: number } {
  // We search in a growing pattern (down, then right, then up, etc.)
  // For simplicity, let's just search in a vertical column first, then move right
  let attempts = 0;
  const maxAttempts = 50;

  // Grid search pattern
  const columns = [400, 800, 1200, 0, -400];
  const rows = [0, 300, -300, 600, -600];

  for (const colOffset of columns) {
    for (const rowOffset of rows) {
      // Don't return the exact same position
      if (colOffset === 0 && rowOffset === 0) continue;

      const tx = baseX + colOffset;
      const ty = baseY + rowOffset;

      if (!isColliding(tx, ty, nodes)) {
        return { x: tx, y: ty };
      }

      attempts++;
      if (attempts > maxAttempts) break;
    }
  }

  // Fallback if no spot found
  return { x: baseX + 400, y: baseY + (Math.random() * 100) };
}

/**
 * Perform a simple hierarchical layout on the entire graph.
 * 
 * 1. Find the entry point (start node).
 * 2. Assign depths (X axis) to each node via BFS.
 * 3. Position Page nodes in each depth-rank.
 * 4. Place Action/Portal nodes in clusters near their parent Pages.
 */
export function autoLayoutGraph(nodes: Node[], edges: Edge[]) {
  // Separate Page nodes from Action/Portal nodes
  const pageNodes = nodes.filter(n => n.type === 'pageNode');
  const synNodes = nodes.filter(n => n.type === 'actionNode' || n.type === 'portalNode');

  const startNode = pageNodes.find(n => (n.data as any).isStartNode) || pageNodes[0];
  if (!startNode) return nodes;

  // Build adjacency for Page nodes only
  const adj: Record<string, string[]> = {};
  edges.forEach(e => {
    // Only track edges between Page nodes or from Page to Syn
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  });

  const depths: Record<string, number> = {};
  const queue: [string, number][] = [[startNode.id, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [id, depth] = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    depths[id] = Math.max(depths[id] || 0, depth);

    // Only follow edges to other Page nodes for the main hierarchy
    (adj[id] || []).forEach(targetId => {
      if (pageNodes.some(pn => pn.id === targetId)) {
        queue.push([targetId, depth + 1]);
      }
    });
  }

  // Group Page nodes by depth
  const ranks: Record<number, string[]> = {};
  pageNodes.forEach(n => {
    const d = depths[n.id] ?? 0;
    if (!ranks[d]) ranks[d] = [];
    ranks[d].push(n.id);
  });

  // Calculate dynamic spacing
  const maxNodesInRank = Math.max(...Object.values(ranks).map(r => r.length), 1);
  const totalRanks = Object.keys(ranks).length;

  const dynamicRowHeight = Math.max(
    LAYOUT_MIN_ROW_HEIGHT,
    LAYOUT_BASE_ROW_HEIGHT + (maxNodesInRank * LAYOUT_ROW_DENSITY_FACTOR)
  );
  const dynamicColWidth = Math.max(
    LAYOUT_MIN_COL_WIDTH,
    LAYOUT_BASE_COL_WIDTH + (totalRanks * LAYOUT_COL_DENSITY_FACTOR)
  );

  // New positions map
  const newPositions: Record<string, { x: number, y: number }> = {};

  // First, position Page nodes
  pageNodes.forEach(n => {
    const depth = depths[n.id] ?? 0;
    const nodesInRank = ranks[depth];
    const indexInRank = nodesInRank.indexOf(n.id);

    newPositions[n.id] = {
      x: depth * dynamicColWidth,
      y: (indexInRank - (nodesInRank.length - 1) / 2) * dynamicRowHeight
    };
  });

  // Second, position Action/Portal nodes (satellites)
  synNodes.forEach(n => {
    const sourcePageId = (n.data as any).sourcePageId;
    const parentPos = newPositions[sourcePageId];
    
    if (parentPos) {
      // Find all syn nodes for this parent
      const siblings = synNodes
        .filter(sn => (sn.data as any).sourcePageId === sourcePageId)
        .sort((a, b) => a.id.localeCompare(b.id));
      const index = siblings.indexOf(n);
      
      // Place them in a horizontal cluster centered ABOVE the parent
      const verticalOffset = -120;
      const horizontalSpacing = 80;
      const horizontalOffset = (index - (siblings.length - 1) / 2) * horizontalSpacing;

      newPositions[n.id] = {
        x: parentPos.x + horizontalOffset,
        y: parentPos.y + verticalOffset
      };
    } else {
      // Fallback for orphaned syn nodes
      newPositions[n.id] = n.position;
    }
  });

  return nodes.map(n => ({
    ...n,
    position: newPositions[n.id] || n.position
  }));
}
