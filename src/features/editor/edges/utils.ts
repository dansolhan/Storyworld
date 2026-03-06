import { Position, type InternalNode } from '@xyflow/react';

// returns the position (top,right,bottom or right) passed node compared to
function getParams(nodeA: InternalNode, nodeB: InternalNode, handleId?: string | null) {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position;

  // when the horizontal difference between the nodes is bigger, we use Left or Right position
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    // here the vertical difference between the nodes is bigger, so we use Top or Bottom position
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position, handleId);
  return { x, y, position };
}

function getHandleCoordsByPosition(node: InternalNode, handlePosition: Position, handleId?: string | null) {
  // all handles are from type source, that's why we use handleBounds.source here
  // we filter by position
  const handleBounds = node.internals.handleBounds;
  const handles = handleBounds?.source || handleBounds?.target;

  // If no handles are found, we default to the node center boundaries
  let handle = null;
  if (handleId) {
    handle = handles?.find((h) => h.id === handleId);
  }
  if (!handle) {
    handle = handles?.find((h) => h.position === handlePosition);
  }

  let offsetX = handle ? handle.x + handle.width / 2 : node.measured.width! / 2;
  let offsetY = handle ? handle.y + handle.height / 2 : node.measured.height! / 2;

  // Fallback if handle wasn't found - compute generic borders
  if (!handle) {
    switch (handlePosition) {
      case Position.Top:
        offsetY = 0;
        break;
      case Position.Bottom:
        offsetY = node.measured.height!;
        break;
      case Position.Left:
        offsetX = 0;
        break;
      case Position.Right:
        offsetX = node.measured.width!;
        break;
    }
  }

  const x = node.internals.positionAbsolute.x + offsetX;
  const y = node.internals.positionAbsolute.y + offsetY;

  return [x, y];
}

function getNodeCenter(node: InternalNode) {
  return {
    x: node.internals.positionAbsolute.x + node.measured.width! / 2,
    y: node.internals.positionAbsolute.y + node.measured.height! / 2,
  };
}

// Returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) for a node to node edge connection.
export function getEdgeParams(source: InternalNode, target: InternalNode, sourceHandle?: string | null, targetHandle?: string | null) {
  const { x: sx, y: sy, position: sourcePos } = getParams(source, target, sourceHandle);
  const { x: tx, y: ty, position: targetPos } = getParams(target, source, targetHandle);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}
