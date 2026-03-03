import { BaseEdge, getBezierPath, type EdgeProps, useInternalNode } from '@xyflow/react';
import { getEdgeParams } from './utils';
import styles from './FloatingEdge.module.css';

export function FloatingEdge({
  id,
  source,
  target,
  label,
  style,
  markerEnd,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
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
}
