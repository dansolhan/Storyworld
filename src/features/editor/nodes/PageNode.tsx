import React, { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, useNodeConnections, type NodeProps, type Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { Globe, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card/Card';
import type { Page } from '../../../domain/Page/Page';
import { useEditorStore } from '../store/useEditorStore';
import styles from './PageNode.module.css';

export type PageNodeData = Omit<Page, 'id'> & Record<string, unknown> & {
  // Optional legacy props; no longer passed from GraphEditor to avoid re-renders
  isStartNode?: boolean;
  pageColorMode?: 'type' | 'atmosphere';
  atmosphereColor?: string;
};

export type PageNodeType = Node<PageNodeData, 'pageNode'>;

export const PageNode = React.memo(
  ({ data, id }: NodeProps<PageNodeType>) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const targetConnections = useNodeConnections({ handleType: 'target' });
    const hasIncoming = targetConnections.length > 0;

    // ── Native Store Subscriptions ──
    const pageTitle = useEditorStore(state => state.pages?.[id]?.title);
    const pageChoices = useEditorStore(state => state.pages?.[id]?.choices);
    const title = pageTitle || data.title || 'Untitled Page';
    const choices = pageChoices || data.choices || [];

    // Use atomic selectors to prevent unnecessary re-renders when other state changes
    const isStartNode = useEditorStore(state => state.startPageId === id) || data.isStartNode;
    const pageColorMode = useEditorStore(state => state.pageColorMode) || data.pageColorMode;
    
    const atmosphereColor = useEditorStore(useShallow(state => 
      data.atmosphereId ? state.atmospheres[data.atmosphereId as string]?.color : undefined
    )) || data.atmosphereColor;

    useEffect(() => {
      updateNodeInternals(id);
    }, [choices.length, id, updateNodeInternals]);

    const isAtmosphereMode = pageColorMode === 'atmosphere';
    const typeClass = isAtmosphereMode ? '' : (data.type === 'plot' ? styles.typePlot : styles.typeLocation);
    const customBg = isAtmosphereMode ? (atmosphereColor || 'var(--color-bg-tertiary)') : undefined;

    const setHoveredPageId = useEditorStore(state => state.setHoveredPageId);

    return (
      <div 
        className={`${styles.nodeWrapper} ${typeClass}`}
        onMouseEnter={() => setHoveredPageId(id)}
        onMouseLeave={() => setHoveredPageId(null)}
      >
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

          {/* Output Handles for Choices (with Hover Tooltip via title attribute) */}
          <div className={styles.choicesContainer}>
            {choices.map((choice, index) => (
              <div key={choice.id} className={styles.choiceWrapper} title={choice.text || 'Empty Choice'}>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={choice.id}
                  className={styles.sourceHandle}
                  style={{
                    top: `${(index + 1) * (100 / (choices.length + 1))}%`,
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
  },
  (prevProps, nextProps) => {
    // Custom comparison to ignore high-frequency props like xPos, yPos, dragging
    // We only re-render if essential data or ID or selection status changes
    // React Flow passes selected via props
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.data === nextProps.data
    );
  }
);

