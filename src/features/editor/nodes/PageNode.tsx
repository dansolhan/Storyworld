import React, { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, useHandleConnections, type NodeProps, type Node } from '@xyflow/react';
import { Card } from '../../../components/ui/Card/Card';
import type { Page } from '../../../domain/Page/Page';
import styles from './PageNode.module.css';

export type PageNodeData = Omit<Page, 'id'> & Record<string, unknown> & {
  isStartNode?: boolean;
  onAddParagraph?: (pageId: string) => void;
  onAddChoice?: (pageId: string) => void;
  onChoiceConnect?: (sourceId: string, choiceId: string, targetId: string) => void;
};

export type PageNodeType = Node<PageNodeData, 'pageNode'>;

export const PageNode: React.FC<NodeProps<PageNodeType>> = ({ data, id }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const targetConnections = useHandleConnections({ type: 'target' });
  const hasIncoming = targetConnections.length > 0;

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.choices?.length, id, updateNodeInternals]);

  const typeClass = data.type === 'plot' ? styles.typePlot : styles.typeLocation;

  return (
    <div className={`${styles.nodeWrapper} ${typeClass}`}>
      {/* Target handle - where this page can be connected TO */}
      <Handle
        type="target"
        position={Position.Top}
        className={styles.targetHandle}
        style={{ opacity: hasIncoming ? 1 : 0 }}
      />

      <Card padding="md" className={styles.card} style={data.isStartNode ? { borderColor: 'var(--color-primary-500)' } : {}}>
        {data.isStartNode && (
          <div className={styles.startNodeBadge}>Start Node</div>
        )}
        <div className={styles.header}>
          <h3 className={styles.title}>{data.title || 'Untitled Page'}</h3>
        </div>

        {/* Output Handles for Choices (with Hover Tooltip via title attribute) */}
        <div className={styles.choicesContainer}>
          {data.choices?.map((choice, index) => (
            <div key={choice.id} className={styles.choiceWrapper} title={choice.text || 'Empty Choice'}>
              <Handle
                type="source"
                position={Position.Right}
                id={choice.id}
                className={styles.sourceHandle}
                style={{ top: `${(index + 1) * (100 / (data.choices.length + 1))}%`, opacity: choice.targetPageId ? 1 : 0 }}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
