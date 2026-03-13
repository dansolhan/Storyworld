import { memo, useMemo, useDeferredValue } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps, useInternalNode } from '@xyflow/react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { getEdgeParams } from './utils';
import { useEditorStore } from '../store/useEditorStore';
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
  const sourceNode = useDeferredValue(rawSourceNode);
  const targetNode = useDeferredValue(rawTargetNode);

  const showAllEdges = useEditorStore(state => state.showAllEdges);
  const hoveredPageId = useEditorStore(state => state.hoveredPageId);

  const isVisible = useMemo(() => {
    if (showAllEdges) return true;
    
    // If either source or target is hovered, show the edge
    if (hoveredPageId === source || hoveredPageId === target) return true;
    
    // If either source or target is selected, show the edge
    if (rawSourceNode?.selected || rawTargetNode?.selected) return true;
    
    return false;
  }, [showAllEdges, hoveredPageId, source, target, rawSourceNode?.selected, rawTargetNode?.selected]);

  // Memoize calculation and snap to 0.5px to reduce micro-recalcs
  const edgeParams = useMemo(() => {
    if (!sourceNode || !targetNode) return null;
    // We already round in the bezier path, but doing it here saves the intersection math
    return getEdgeParams(
      sourceNode,
      targetNode,
      sourceHandleId,
      targetHandleId
    );
  }, [
    sourceNode ? Math.round(sourceNode.internals.positionAbsolute.x * 2) / 2 : 0,
    sourceNode ? Math.round(sourceNode.internals.positionAbsolute.y * 2) / 2 : 0,
    targetNode ? Math.round(targetNode.internals.positionAbsolute.x * 2) / 2 : 0,
    targetNode ? Math.round(targetNode.internals.positionAbsolute.y * 2) / 2 : 0,
    sourceNode?.measured.width,
    sourceNode?.measured.height,
    targetNode?.measured.width,
    targetNode?.measured.height,
    sourceHandleId,
    targetHandleId
  ]);

  if (!sourceNode || !targetNode || !isVisible || !edgeParams) {
    return null;
  }

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

  // Estimate label width from character count (min 100, ~8.5px per char + space for icon + padding)
  const labelText = label ? String(label) : '';
  const labelWidth = Math.max(100, labelText.length * 8.5 + 56);
  const labelHeight = 24;

  const dx = tx - sx;
  const dy = ty - sy;
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  const isReverse = isHorizontal ? dx < 0 : dy < 0;

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
            <div className={styles.labelInner}>
              {/* Prefix arrows (Left or Up) */}
              {isReverse && (
                <div className={styles.iconWrapper}>
                  {isHorizontal ? <ArrowLeft size={12} /> : <ArrowUp size={12} />}
                </div>
              )}
              
              <div className={styles.labelText}>{labelText}</div>
              
              {/* Suffix arrows (Right or Down) */}
              {!isReverse && (
                <div className={styles.iconWrapper}>
                  {isHorizontal ? <ArrowRight size={12} /> : <ArrowDown size={12} />}
                </div>
              )}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
});
