import { memo, useMemo } from 'react';
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
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Memoize calculation and snap to 0.5px to reduce micro-recalcs
  const edgeParams = useMemo(() => {
    return getEdgeParams(
      sourceNode,
      targetNode,
      sourceHandleId,
      targetHandleId
    );
  }, [
    sourceNode.internals.positionAbsolute.x,
    sourceNode.internals.positionAbsolute.y,
    sourceNode.measured.width,
    sourceNode.measured.height,
    targetNode.internals.positionAbsolute.x,
    targetNode.internals.positionAbsolute.y,
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
