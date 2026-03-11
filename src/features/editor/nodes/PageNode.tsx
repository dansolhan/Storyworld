import React, { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, useNodeConnections, type NodeProps, type Node } from '@xyflow/react';
import { Globe, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card/Card';
import type { Page } from '../../../domain/Page/Page';
import styles from './PageNode.module.css';

export type PageNodeData = Omit<Page, 'id'> & Record<string, unknown> & {
  isStartNode?: boolean;
  onAddParagraph?: (pageId: string) => void;
  onAddChoice?: (pageId: string) => void;
  onChoiceConnect?: (sourceId: string, choiceId: string, targetId: string) => void;
  pageColorMode?: 'type' | 'atmosphere';
  atmosphereColor?: string;
};

export type PageNodeType = Node<PageNodeData, 'pageNode'>;

export const PageNode: React.FC<NodeProps<PageNodeType>> = ({ data, id }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const targetConnections = useNodeConnections({ handleType: 'target' });
  const hasIncoming = targetConnections.length > 0;

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.choices?.length, id, updateNodeInternals]);

  const isAtmosphereMode = data.pageColorMode === 'atmosphere';
  const typeClass = isAtmosphereMode ? '' : (data.type === 'plot' ? styles.typePlot : styles.typeLocation);
  const customBg = isAtmosphereMode ? (data.atmosphereColor || 'var(--color-bg-tertiary)') : undefined;

  return (
    <div className={`${styles.nodeWrapper} ${typeClass}`}>
      {/* Target handle - where this page can be connected TO */}
      <Handle
        type="target"
        position={Position.Top}
        className={styles.targetHandle}
        style={{ opacity: hasIncoming ? 1 : 0 }}
      />

      <Card
        padding="md"
        className={styles.card}
        style={{
          ...(data.isStartNode ? { borderColor: 'var(--color-primary-500)' } : {}),
          ...(isAtmosphereMode ? { backgroundColor: customBg, borderColor: customBg } : {})
        }}
      >
        {data.isStartNode && (
          <div className={styles.startNodeBadge}>Start Node</div>
        )}
        <div
          className={styles.header}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            ...(isAtmosphereMode ? { backgroundColor: 'rgba(255, 255, 255, 0.1)' } : {})
          }}
        >
          {data.type === 'plot' ? (
            <AlertCircle size={32} style={{ opacity: 0.8 }} />
          ) : (
            <Globe size={32} style={{ opacity: 0.8 }} />
          )}
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
                style={{
                  top: `${(index + 1) * (100 / (data.choices.length + 1))}%`,
                  // Show handle if choice has a target page OR if it's action-only (synth node will appear)
                  opacity: (choice.targetPageId || (choice.actions && choice.actions.length > 0)) ? 1 : 0
                }}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

