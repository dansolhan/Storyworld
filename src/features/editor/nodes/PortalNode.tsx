import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../store/useEditorStore';
import styles from './PortalNode.module.css';

export interface PortalNodeData extends Record<string, unknown> {
  sourcePageId: string;
  subplotId: string;
  subplotName: string;
  targetPageName: string;
}

export type PortalNodeType = Node<PortalNodeData, 'portalNode'>;

const HIDDEN: React.CSSProperties = { opacity: 0 };

export const PortalNode = React.memo(({ data, id }: NodeProps<PortalNodeType>) => {
  const { setCurrentPlotId, setHoveredPageId } = useEditorStore(
    useShallow((state) => ({
      setCurrentPlotId: state.setCurrentPlotId,
      setHoveredPageId: state.setHoveredPageId,
    }))
  );

  const handleDoubleClick = () => {
    if (data.subplotId) {
      setCurrentPlotId(data.subplotId);
    }
  };

  const tooltip = [
    `Portal → ${data.subplotName}`,
    `Page: ${data.targetPageName}`,
    'Double-click to enter subplot',
  ].join('\n');

  return (
    <div
      className={styles.node}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setHoveredPageId(id)}
      onMouseLeave={() => setHoveredPageId(null)}
      title={tooltip}
    >
      {/* 4 invisible target handles — one per side */}
      <Handle type="target" position={Position.Top}    id="t-top"    style={HIDDEN} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={HIDDEN} />
      <Handle type="target" position={Position.Left}   id="t-left"   style={HIDDEN} />
      <Handle type="target" position={Position.Right}  id="t-right"  style={HIDDEN} />

      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <path d="M12 8v8" />
        <path d="M2 12c0 4.4 4.5 8 10 8s10-3.6 10-8" />
      </svg>
    </div>
  );
});
