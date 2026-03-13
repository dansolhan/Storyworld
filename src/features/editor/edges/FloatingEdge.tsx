import { memo, useMemo } from 'react';
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

  const showAllEdges = useEditorStore(state => state.showAllEdges);
  const hoveredPageId = useEditorStore(state => state.hoveredPageId);
  const isDragging = useEditorStore(state => state.isDragging);
  const edges = useEditorStore(state => state.edges);

  // Group edges between the same nodes (in either direction) to calculate parallel offsets
  const parallelOffset = useMemo(() => {
    const pairEdges = edges
      .filter(e => 
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
      )
      .sort((a, b) => a.id.localeCompare(b.id));

    if (pairEdges.length <= 1) return 0;
    
    const index = pairEdges.findIndex(e => e.id === id);
    // 30px gap between bundled lines
    const GAP = 30;
    return (index - (pairEdges.length - 1) / 2) * GAP;
  }, [edges, source, target, id]);

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
  // Priority: Hovered node > Selected source node > Selected target node
  const edgeType = useMemo(() => {
    // If hovering a node, that is our primary focus
    if (hoveredPageId) {
      if (source === hoveredPageId) return 'exit';
      if (target === hoveredPageId) return 'entry';
      return null;
    }
    
    // Otherwise, check selected states
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
    Math.round(targetPos.x * 2) / 2,
    Math.round(targetPos.y * 2) / 2,
    sourcePos.w,
    sourcePos.h,
    targetPos.w,
    targetPos.h,
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
    sourceX: Math.round(sx * 2) / 2,
    sourceY: Math.round(sy * 2) / 2,
    sourcePosition: srcPos,
    targetX: Math.round(tx * 2) / 2,
    targetY: Math.round(ty * 2) / 2,
    targetPosition: tgtPos,
  });

  const labelText = label ? String(label) : '';

  // Determine directional arrow based on edge vector
  const dx = tx - sx;
  const dy = ty - sy;
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  const isReverse = isHorizontal ? dx < 0 : dy < 0;

  // Stagger labels to avoid overlap when bundled
  // Since labels are wide (~150px) but short (~25px), vertical staggering is most effective
  const STAGGER_Y_GAP = 35;
  const pairEdges = edges
    .filter(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))
    .sort((a, b) => a.id.localeCompare(b.id));
    
  const totalEdges = pairEdges.length;
  const edgeIndex = pairEdges.findIndex(e => e.id === id);
  const relativeIndex = edgeIndex - (totalEdges - 1) / 2;
  
  // Stagger along the line + a vertical "side-step" to clear wide labels
  // Along the line (X for horizontal, Y for vertical)
  const alongLineGap = 60;
  const staggerAlongX = isHorizontal ? relativeIndex * alongLineGap : 0;
  const staggerAlongY = isHorizontal ? 0 : relativeIndex * alongLineGap;
  // Perpendicular side-step (always vertical to help clear wide labels)
  const sideStepY = relativeIndex * STAGGER_Y_GAP;

  // Consolidate arrow icon logic to be strictly singular
  let DirectionIcon = null;
  if (isHorizontal) {
    DirectionIcon = isReverse ? ArrowLeft : ArrowRight;
  } else {
    DirectionIcon = isReverse ? ArrowUp : ArrowDown;
  }

  // Avoid adding auto-arrows if the user text already has them or if text is empty
  const hasManualArrow = labelText.startsWith('<-') || labelText.endsWith('->') || labelText.startsWith('↑') || labelText.endsWith('↓');
  const shouldShowIcon = !!DirectionIcon && labelText && !hasManualArrow;

  // Dynamic colors based on edge direction
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

  // Define marker IDs for our custom colored arrows
  const markerId = edgeType === 'entry' 
    ? 'floating-arrow-entry' 
    : edgeType === 'exit' 
      ? 'floating-arrow-exit' 
      : 'floating-arrow-default';

  const labelClassName = `${styles.label} ${edgeType ? styles[edgeType] : ''}`;

  return (
    <>
      {/* 
        Custom SVG defs for arrowheads. 
        We define these globally (all edges share them) so we can switch the arrowhead color
        dynamically based on hover/focus without updating the central store.
      */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="floating-arrow-entry"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={ENTRY_HEX} />
          </marker>
          <marker
            id="floating-arrow-exit"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EXIT_HEX} />
          </marker>
          <marker
            id="floating-arrow-default"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={DEFAULT_HEX} />
          </marker>
        </defs>
      </svg>

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
            {/* Render directional icon — Prefix for reverse, Suffix for forward */}
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
