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
import { useEdgePairInfo } from './edgePairs';
import { useShallow } from 'zustand/react/shallow';
import styles from './FloatingEdge.module.css';

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

  // Position within the bundle of parallel edges between this (source,target) pair,
  // derived once at the FlowView level so each edge does O(1) work here.
  const { index: edgeIndex, total: totalEdges } = useEdgePairInfo(id);

  const { showAllEdges, hoveredPageId } = useEditorStore(
    useShallow((state) => ({
      showAllEdges: state.showAllEdges,
      hoveredPageId: state.hoveredPageId,
    }))
  );

  const parallelOffset = useMemo(() => {
    if (totalEdges <= 1) return 0;
    // 30px gap between bundled lines
    const GAP = 30;
    return (edgeIndex - (totalEdges - 1) / 2) * GAP;
  }, [edgeIndex, totalEdges]);

  // Read positions directly from the internal node — React Flow already
  // batches its internal store updates to the paint cycle, so no extra
  // throttling is needed here and edges follow the cursor in real time.
  const sx0 = rawSourceNode?.internals.positionAbsolute.x ?? 0;
  const sy0 = rawSourceNode?.internals.positionAbsolute.y ?? 0;
  const sw0 = rawSourceNode?.measured.width ?? 0;
  const sh0 = rawSourceNode?.measured.height ?? 0;
  const tx0 = rawTargetNode?.internals.positionAbsolute.x ?? 0;
  const ty0 = rawTargetNode?.internals.positionAbsolute.y ?? 0;
  const tw0 = rawTargetNode?.measured.width ?? 0;
  const th0 = rawTargetNode?.measured.height ?? 0;

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

  const edgeParams = useMemo(() => {
    if (!rawSourceNode || !rawTargetNode) return null;
    return getEdgeParams(rawSourceNode, rawTargetNode, sourceHandleId, targetHandleId, parallelOffset);
  }, [
    sx0, sy0, sw0, sh0,
    tx0, ty0, tw0, th0,
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
