import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../store/useEditorStore';
import styles from './ActionNode.module.css';

export interface ActionNodeData extends Record<string, unknown> {
  sourcePageId: string;
  choiceId: string;
  choiceText: string;
  actionNames: string[];
}

export type ActionNodeType = Node<ActionNodeData, 'actionNode'>;

export const ActionNode = React.memo(({ data, id }: NodeProps<ActionNodeType>) => {
  const { setSelectedPage, setSidebarTab, setHoveredPageId } = useEditorStore(
    useShallow((state) => ({
      setSelectedPage: state.setSelectedPage,
      setSidebarTab: state.setSidebarTab,
      setHoveredPageId: state.setHoveredPageId,
    }))
  );

  const handleDoubleClick = () => {
    setSelectedPage(data.sourcePageId);
    setSidebarTab('actions');
  };

  const tooltip = [
    data.choiceText || 'Action Choice',
    data.actionNames.length ? `Actions: ${data.actionNames.join(', ')}` : null,
    'Double-click to open Actions pane',
  ].filter(Boolean).join('\n');

  return (
    <div 
      className={styles.node} 
      onDoubleClick={handleDoubleClick} 
      onMouseEnter={() => setHoveredPageId(id)}
      onMouseLeave={() => setHoveredPageId(null)}
      title={tooltip}
    >
      <Handle type="target" position={Position.Left} className={styles.handle} style={{ opacity: 0 }} />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    </div>
  );
});
