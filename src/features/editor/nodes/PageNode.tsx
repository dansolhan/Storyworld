import React, { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps, type Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { Globe, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card/Card';
import type { Page } from '../../../domain/Page/Page';
import { useEditorStore } from '../store/useEditorStore';
import styles from './PageNode.module.css';

export type PageNodeData = Omit<Page, 'id'> & Record<string, unknown> & {
  isStartNode?: boolean;
  pageColorMode?: 'type' | 'atmosphere';
  atmosphereColor?: string;
};

export type PageNodeType = Node<PageNodeData, 'pageNode'>;

const HIDDEN: React.CSSProperties = { opacity: 0 };

export const PageNode = React.memo(
  ({ data, id }: NodeProps<PageNodeType>) => {
    const updateNodeInternals = useUpdateNodeInternals();

    // ── Native Store Subscriptions ──
    const pageTitle = useEditorStore(state => state.pages?.[id]?.title);
    const pageChoices = useEditorStore(state => state.pages?.[id]?.choices);
    const title = pageTitle || data.title || 'Untitled Page';
    const choices = pageChoices || data.choices || [];

    const isStartNode = useEditorStore(state => state.startPageId === id) || data.isStartNode;
    const pageColorMode = useEditorStore(state => state.pageColorMode) || data.pageColorMode;

    const atmosphereColor = useEditorStore(useShallow(state =>
      data.atmosphereId ? state.atmospheres[data.atmosphereId as string]?.color : undefined
    )) || data.atmosphereColor;

    const setHoveredPageId = useEditorStore(state => state.setHoveredPageId);

    useEffect(() => {
      updateNodeInternals(id);
    }, [choices.length, id, updateNodeInternals]);

    const isAtmosphereMode = pageColorMode === 'atmosphere';
    const typeClass = isAtmosphereMode ? '' : (data.type === 'plot' ? styles.typePlot : styles.typeLocation);
    const customBg = isAtmosphereMode ? (atmosphereColor || 'var(--color-bg-tertiary)') : undefined;

    return (
      <div
        className={`${styles.nodeWrapper} ${typeClass}`}
        onMouseEnter={() => setHoveredPageId(id)}
        onMouseLeave={() => setHoveredPageId(null)}
      >
        {/* 4 invisible target handles — one per side for floating edge routing */}
        <Handle type="target" position={Position.Top}    id="t-top"    style={HIDDEN} />
        <Handle type="target" position={Position.Bottom} id="t-bottom" style={HIDDEN} />
        <Handle type="target" position={Position.Left}   id="t-left"   style={HIDDEN} />
        <Handle type="target" position={Position.Right}  id="t-right"  style={HIDDEN} />

        <Card
          padding="md"
          className={styles.card}
          style={{
            ...(data.isStartNode ? { borderColor: 'var(--color-primary-500)' } : {}),
            ...(isAtmosphereMode ? { backgroundColor: customBg as any, borderColor: customBg as any } : {})
          }}
        >
          {isStartNode && (
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
            <h3 className={styles.title}>{title}</h3>
          </div>
        </Card>

        {/* Source handles for choices — direct children of nodeWrapper so React Flow
            measures their positions correctly for edge routing */}
        {choices.map((choice, index) => (
          <Handle
            key={choice.id}
            type="source"
            position={Position.Right}
            id={choice.id}
            style={{
              ...HIDDEN,
              top: `${(index + 1) * (100 / (choices.length + 1))}%`,
            }}
          />
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.data === nextProps.data
    );
  }
);
