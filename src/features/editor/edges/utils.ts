import { Position, type InternalNode } from '@xyflow/react';

function getNodeCenter(node: InternalNode) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured.width ?? 0) / 2,
    y: node.internals.positionAbsolute.y + (node.measured.height ?? 0) / 2,
  };
}

/**
 * Get the exit/entry point on a node's border at the given cardinal side.
 * Shifty by 'offset' perpendicular to the side's axis to allow parallel edges.
 */
function getPointOnSide(
  node: InternalNode,
  side: Position,
  offset: number = 0
): { x: number; y: number } {
  const w = node.measured.width ?? 0;
  const h = node.measured.height ?? 0;
  const abs = node.internals.positionAbsolute;

  switch (side) {
    case Position.Top:
      return { x: abs.x + w / 2 + offset, y: abs.y };
    case Position.Bottom:
      return { x: abs.x + w / 2 + offset, y: abs.y + h };
    case Position.Left:
      return { x: abs.x, y: abs.y + h / 2 + offset };
    case Position.Right:
      return { x: abs.x + w, y: abs.y + h / 2 + offset };
  }
}

/**
 * Determine which side of `nodeA` faces `nodeB`, then return the
 * center-of-side (plus offset) coordinates and the cardinal direction.
 */
function getParams(
  nodeA: InternalNode,
  nodeB: InternalNode,
  offset: number = 0
) {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const hDiff = Math.abs(centerA.x - centerB.x);
  const vDiff = Math.abs(centerA.y - centerB.y);

  const position: Position =
    hDiff > vDiff
      ? centerA.x > centerB.x ? Position.Left : Position.Right
      : centerA.y > centerB.y ? Position.Top  : Position.Bottom;

  const { x, y } = getPointOnSide(nodeA, position, offset);
  return { x, y, position };
}

/**
 * Returns (sx, sy, tx, ty, sourcePos, targetPos) for a floating bezier edge.
 *
 * Takes an 'offset' to shift the edge points for bidirectional or parallel edges.
 */
export function getEdgeParams(
  source: InternalNode,
  target: InternalNode,
  _sourceHandle?: string | null,
  _targetHandle?: string | null,
  offset: number = 0
) {
  const { x: sx, y: sy, position: sourcePos } = getParams(source, target, offset);
  // Note: the target node's offset is inverted so the lines stay parallel
  const { x: tx, y: ty, position: targetPos } = getParams(target, source, offset);

  return { sx, sy, tx, ty, sourcePos, targetPos };
}
