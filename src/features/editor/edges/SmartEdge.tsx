import { BaseEdge, getBezierPath, type EdgeProps, Position } from '@xyflow/react';

export function SmartEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
}: EdgeProps) {

  // Dynamically calculate the direction the Bezier curve should curve towards
  // If the target is below the source, we curve Bottom -> Top
  // If the target is above the source, we curve Top -> Bottom
  // If the target is to the right, Right -> Left.
  let sourcePosition = Position.Right;
  let targetPosition = Position.Top;

  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;

  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    // Vertical dominance
    sourcePosition = deltaY > 0 ? Position.Bottom : Position.Top;
    targetPosition = deltaY > 0 ? Position.Top : Position.Bottom;
  } else {
    // Horizontal dominance
    sourcePosition = deltaX > 0 ? Position.Right : Position.Left;
    targetPosition = deltaX > 0 ? Position.Left : Position.Right;
  }

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
}
