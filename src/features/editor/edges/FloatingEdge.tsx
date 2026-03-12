import { memo, useMemo, useDeferredValue } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps, useInternalNode } from '@xyflow/react';
import { getEdgeParams } from './utils';
import styles from './FloatingEdge.module.css';

export const FloatingEdge = memo(({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  label,
  style,
  markerEnd,
}: EdgeProps) => {
  const rawSourceNode = useInternalNode(source);
  const rawTargetNode = useInternalNode(target);

  // Use deferred values for node data to low-prioritize edge pathing recalculations.
  // This ensures the node movement itself (high priority) stays snappy while the 
  // computationally heavy edge math "trails" slightly.
  const sourceNode = useDeferredValue(rawSourceNode);
  const targetNode = useDeferredValue(rawTargetNode);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Memoize calculation and snap to 0.5px to reduce micro-recalcs
  const edgeParams = useMemo(() => {
    // We already round in the bezier path, but doing it here saves the intersection math
    return getEdgeParams(
      sourceNode,
      targetNode,
      sourceHandleId,
      targetHandleId
    );
  }, [
    // We use rounded coordinates in the dependency array to naturally throttle 
    // updates for micro-movements (sub-pixel jitter)
    Math.round(sourceNode.internals.positionAbsolute.x * 2) / 2,
    Math.round(sourceNode.internals.positionAbsolute.y * 2) / 2,
    Math.round(targetNode.internals.positionAbsolute.x * 2) / 2,
    Math.round(targetNode.internals.positionAbsolute.y * 2) / 2,
    sourceNode.measured.width,
    sourceNode.measured.height,
    targetNode.measured.width,
    targetNode.measured.height,
    sourceHandleId,
    targetHandleId
  ]);

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: Math.round(sx * 2) / 2,
    sourceY: Math.round(sy * 2) / 2,
    sourcePosition: sourcePos,
    targetX: Math.round(tx * 2) / 2,
    targetY: Math.round(ty * 2) / 2,
    targetPosition: targetPos,
  });
// ... (rest of the file)

  // Estimate label width from character count (min 80, ~8px per char)
  const labelText = label ? String(label) : '';
  const labelWidth = Math.max(80, labelText.length * 8 + 24);
  const labelHeight = 24;

  return (
    <g className={styles.edgeGroup}>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {labelText && (
        <foreignObject
          x={labelX - labelWidth / 2}
          y={labelY - labelHeight / 2}
          width={labelWidth}
          height={labelHeight}
          className={styles.labelForeign}
        >
          {/* @ts-ignore – xmlns needed for SVG foreignObject */}
          <div xmlns="http://www.w3.org/1999/xhtml" className={styles.label}>
            {labelText}
          </div>
        </foreignObject>
      )}
    </g>
  );
});
