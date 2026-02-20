import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import type { Page } from '../../../domain/Page/Page';
import styles from './PageNode.module.css';

export type PageNodeData = Omit<Page, 'id'> & Record<string, unknown> & {
  onAddParagraph?: (pageId: string) => void;
  onAddChoice?: (pageId: string) => void;
  onChoiceConnect?: (sourceId: string, choiceId: string, targetId: string) => void;
};

export type PageNodeType = Node<PageNodeData, 'pageNode'>;

export const PageNode: React.FC<NodeProps<PageNodeType>> = ({ data, id }) => {
  return (
    <div className={styles.nodeWrapper}>
      {/* Target handle - where this page can be connected TO */}
      <Handle
        type="target"
        position={Position.Top}
        className={styles.targetHandle}
      />

      <Card padding="md" className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>{data.title || 'Untitled Page'}</h3>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Paragraphs</h4>
            {data.paragraphs?.length > 0 ? (
              <ul className={styles.list}>
                {data.paragraphs.map((p) => (
                  <li key={p.id} className={styles.paragraphItem}>
                    <p className={styles.paragraphText}>{p.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyText}>No paragraphs.</p>
            )}
            {data.onAddParagraph && (
              <Button size="sm" variant="secondary" onClick={() => data.onAddParagraph!(id)} fullWidth>
                + Add Paragraph
              </Button>
            )}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Choices (Branches)</h4>
            {data.choices?.length > 0 ? (
              <ul className={styles.list}>
                {data.choices.map((c) => (
                  <li key={c.id} className={styles.choiceItem}>
                    <div className={styles.choiceText}>{c.text}</div>
                    {/* Source handle - where this choice connects FROM */}
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={c.id}
                      className={styles.sourceHandle}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyText}>No choices.</p>
            )}
            {data.onAddChoice && (
              <Button size="sm" variant="secondary" onClick={() => data.onAddChoice!(id)} fullWidth>
                + Add Choice
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
