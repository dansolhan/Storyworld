import { memo, useMemo, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  useInternalNode,
} from '@xyflow/react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { getEdgeParams } from './utils';
import { useEditorStore } from '../store/useEditorStore';
import { useThrottledNodePos } from '../hooks/graph/useThrottledNodePos';
import { useShallow } from 'zustand/react/shallow';
import styles from './FloatingEdge.module.css';

const DRAG_THROTTLE_MS = 350;

export const FloatingEdge = memo(({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  label,
  style,
}: EdgeProps) => {
  const rawSourceNode = useInternalNode(source);
  const rawTargetNode = useInternalNode(target);

  // Focus only on edges that belong to this pair. 
  // useShallow ensures we only re-render if the set of parallel edges changes.
  const pairEdges = useEditorStore(
    useShallow(useCallback(
      (state) => state.edges.filter(e => 
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
      ).sort((a, b) => a.id.localeCompare(b.id)),
      [source, target]
    ))
  );

  const { showAllEdges, hoveredPageId, isDragging } = useEditorStore(
    useShallow((state) => ({
      showAllEdges: state.showAllEdges,
      hoveredPageId: state.hoveredPageId,
      isDragging: state.isDragging,
    }))
  );

  // Group edges between the same nodes (in either direction) to calculate parallel offsets
  const parallelOffset = useMemo(() => {
    if (pairEdges.length <= 1) return 0;
    const index = pairEdges.findIndex(e => e.id === id);
    // 30px gap between bundled lines
    const GAP = 30;
    return (index - (pairEdges.length - 1) / 2) * GAP;
  }, [pairEdges, id]);

  // Throttle during drag, immediate otherwise
  const throttleDelay = isDragging ? DRAG_THROTTLE_MS : 0;
  const sourcePos = useThrottledNodePos(rawSourceNode, throttleDelay);
  const targetPos = useThrottledNodePos(rawTargetNode, throttleDelay);

  const isVisible = useMemo(() => {
    if (showAllEdges) return true;
    if (hoveredPageId === source || hoveredPageId === target) return true;
    if (rawSourceNode?.selected || rawTargetNode?.selected) return true;
    return false;
  }, [showAllEdges, hoveredPageId, source, target, rawSourceNode?.selected, rawTargetNode?.selected]);

  // Determine if this is an entry or exit edge for the currently focused/hovered context
  const edgeType = useMemo(() => {
    if (hoveredPageId) {
      if (source === hoveredPageId) return 'exit';
      if (target === hoveredPageId) return 'entry';
      return null;
    }
    if (rawSourceNode?.selected) return 'exit';
    if (rawTargetNode?.selected) return 'entry';
    return null;
  }, [hoveredPageId, source, target, rawSourceNode?.selected, rawTargetNode?.selected]);

  // Recompute edge path when throttled positions or sizes change
  const edgeParams = useMemo(() => {
    if (!rawSourceNode || !rawTargetNode) return null;
    return getEdgeParams(rawSourceNode, rawTargetNode, sourceHandleId, targetHandleId, parallelOffset);
  }, [
    Math.round(sourcePos.x * 2) / 2,
    Math.round(sourcePos.y * 2) / 2,
    Math.round(sourcePos.w || 0),
    Math.round(sourcePos.h || 0),
    Math.round(targetPos.x * 2) / 2,
    Math.round(targetPos.y * 2) / 2,
    Math.round(targetPos.w || 0),
    Math.round(targetPos.h || 0),
    sourceHandleId,
    targetHandleId,
    rawSourceNode?.internals.handleBounds,
    rawTargetNode?.internals.handleBounds,
    parallelOffset,
  ]);

  if (!rawSourceNode || !rawTargetNode || !isVisible || !edgeParams) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos: srcPos, targetPos: tgtPos } = edgeParams;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: srcPos,
    targetX: tx,
    targetY: ty,
    targetPosition: tgtPos,
  });

  const labelText = label ? String(label) : '';

  // Determine directional arrow based on edge vector
  const dx = tx - sx;
  const dy = ty - sy;
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  const isReverse = isHorizontal ? dx < 0 : dy < 0;

  // Stagger labels to avoid overlap when bundled
  const STAGGER_Y_GAP = 35;
  const totalEdges = pairEdges.length;
  const edgeIndex = pairEdges.findIndex(e => e.id === id);
  const relativeIndex = edgeIndex - (totalEdges - 1) / 2;
  
  const alongLineGap = 60;
  const staggerAlongX = isHorizontal ? relativeIndex * alongLineGap : 0;
  const staggerAlongY = isHorizontal ? 0 : relativeIndex * alongLineGap;
  const sideStepY = relativeIndex * STAGGER_Y_GAP;

  let DirectionIcon = null;
  if (isHorizontal) {
    DirectionIcon = isReverse ? ArrowLeft : ArrowRight;
  } else {
    DirectionIcon = isReverse ? ArrowUp : ArrowDown;
  }

  const hasManualArrow = labelText.startsWith('<-') || labelText.endsWith('->') || labelText.startsWith('↑') || labelText.endsWith('↓');
  const shouldShowIcon = !!DirectionIcon && labelText && !hasManualArrow;

  const ENTRY_HEX = '#10b981';
  const EXIT_HEX = '#6366f1';
  const DEFAULT_HEX = '#94a3b8';

  const activeColor = edgeType === 'entry' 
    ? ENTRY_HEX 
    : edgeType === 'exit' 
      ? EXIT_HEX 
      : (style?.stroke || DEFAULT_HEX);

  const dynamicEdgeStyle = {
    ...(style || {}),
    stroke: activeColor,
    strokeWidth: edgeType ? 3 : (style?.strokeWidth || 2),
    transition: 'stroke 0.2s, stroke-width 0.2s',
  };

  const markerId = edgeType === 'entry' 
    ? 'floating-arrow-entry' 
    : edgeType === 'exit' 
      ? 'floating-arrow-exit' 
      : 'floating-arrow-default';

  const labelClassName = `${styles.label} ${edgeType ? styles[edgeType] : ''}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={dynamicEdgeStyle}
      />
      {labelText && (
        <EdgeLabelRenderer>
          <div
            className={labelClassName}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX + staggerAlongX}px, ${labelY + staggerAlongY + sideStepY}px)`,
            }}
          >
            {shouldShowIcon && isReverse && (
              <span className={styles.iconWrapper} style={{ color: activeColor }}>
                <DirectionIcon size={12} />
              </span>
            )}

            <span className={styles.labelText}>{labelText}</span>

            {shouldShowIcon && !isReverse && (
              <span className={styles.iconWrapper} style={{ color: activeColor }}>
                <DirectionIcon size={12} />
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
