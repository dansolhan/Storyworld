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
import {
  edgeColorFor,
  EDGE_COLOR_DEFAULT,
  EDGE_WIDTH_DEFAULT,
  EDGE_WIDTH_EMPHASIS,
} from './edgeColors';
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

  /*
   * Positions come straight off the internal nodes — React Flow batches its
   * store updates to the paint cycle, so edges follow the cursor without extra
   * throttling here.
   *
   * This used to depend on the individual coordinates rather than the nodes, so
   * that a change like `selected` flipping would not recompute the geometry.
   * React Compiler cannot verify a dependency list narrower than what the body
   * reads, so it was skipping this component entirely — and `getEdgeParams` is
   * cheap arithmetic. Depending on the nodes lets the whole component be
   * optimised, which is worth more.
   */
  const edgeParams = useMemo(() => {
    if (!rawSourceNode || !rawTargetNode) return null;
    return getEdgeParams(rawSourceNode, rawTargetNode, sourceHandleId, targetHandleId, parallelOffset);
  }, [rawSourceNode, rawTargetNode, sourceHandleId, targetHandleId, parallelOffset]);

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

  const activeColor = edgeColorFor(edgeType) ?? style?.stroke ?? EDGE_COLOR_DEFAULT;

  const dynamicEdgeStyle = {
    ...(style || {}),
    stroke: activeColor,
    strokeWidth: edgeType ? EDGE_WIDTH_EMPHASIS : (style?.strokeWidth || EDGE_WIDTH_DEFAULT),
    transition: 'stroke var(--duration-fast) var(--ease-standard), stroke-width var(--duration-fast) var(--ease-standard)',
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
