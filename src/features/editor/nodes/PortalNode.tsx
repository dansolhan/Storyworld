import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useEditorStore } from '../store/useEditorStore';
import styles from './PortalNode.module.css';

export interface PortalNodeData extends Record<string, unknown> {
  sourcePageId: string;
  subplotId: string;
  subplotName: string;
  targetPageName: string;
}

export type PortalNodeType = Node<PortalNodeData, 'portalNode'>;

export const PortalNode: React.FC<NodeProps<PortalNodeType>> = ({ data }) => {
  const setCurrentPlotId = useEditorStore((state) => state.setCurrentPlotId);

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
    <div className={styles.node} onDoubleClick={handleDoubleClick} title={tooltip}>
      <Handle type="target" position={Position.Left} className={styles.handle} style={{ opacity: 0 }} />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <path d="M12 8v8" />
        <path d="M2 12c0 4.4 4.5 8 10 8s10-3.6 10-8" />
      </svg>
    </div>
  );
};
