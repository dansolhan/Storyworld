import React, { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps, type Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { Page } from '../../../domain/Page/Page';
import { isUnwritten } from '../../../domain/Page/pageStatus';
import { useEditorStore } from '../store/useEditorStore';
import styles from './PageNode.module.css';

export type PageNodeData = Omit<Page, 'id'> & Record<string, unknown> & {
  isStartNode?: boolean;
  atmosphereColor?: string;
};

export type PageNodeType = Node<PageNodeData, 'pageNode'>;

const HIDDEN: React.CSSProperties = { opacity: 0 };

const pluralise = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * A page on the canvas.
 *
 * Type is carried by the kicker and the border's stroke style — a dashed edge
 * for plot/action pages — rather than by a coloured fill, so the canvas stays
 * one material and the accent means "selected" everywhere it appears.
 *
 * Having no prose yet is a separate fact from being a plot page, so it is drawn
 * separately: the stroke keeps saying what the page *is* and fades to say it is
 * not written. Otherwise dashed would have to mean two things at once.
 */
export const PageNode = React.memo(
  ({ data, id }: NodeProps<PageNodeType>) => {
    const updateNodeInternals = useUpdateNodeInternals();

    const pageTitle = useEditorStore((state) => state.pages?.[id]?.title);
    const pageChoices = useEditorStore((state) => state.pages?.[id]?.choices);
    const pageParagraphs = useEditorStore((state) => state.pages?.[id]?.paragraphs);
    const pageEvents = useEditorStore((state) => state.pages?.[id]?.events);
    const title = pageTitle || data.title || 'Untitled Page';
    const choices = pageChoices || data.choices || [];
    const events = pageEvents || [];

    const isStartNode = useEditorStore((state) => state.startPageId === id) || data.isStartNode;
    const isEditing = useEditorStore((state) => state.selectedPageId === id);

    const atmosphereColor = useEditorStore(useShallow((state) =>
      data.atmosphereId ? state.atmospheres[data.atmosphereId as string]?.color : undefined
    )) || data.atmosphereColor;

    const setHoveredPageId = useEditorStore((state) => state.setHoveredPageId);

    useEffect(() => {
      updateNodeInternals(id);
    }, [choices.length, id, updateNodeInternals]);

    const isPlot = data.type === 'plot';
    const unwritten = isUnwritten({ paragraphs: pageParagraphs ?? data.paragraphs ?? [] });

    /*
     * The kicker states facts about the page, and selection is not one of them.
     *
     * It used to read "Editing" while a page was selected, which *replaced* the
     * facts — so selecting the start page hid that it was the start page, and setting
     * one hid it at the very moment it was set, since setting selects. The design
     * says selection tints the kicker rather than rewriting it, which the stylesheet
     * already does; the node's accent border and ring say the rest.
     */
    const kicker = [
      isPlot ? 'Plot / Action' : 'Location',
      isStartNode ? 'Start' : null,
      unwritten ? 'Unwritten' : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const meta = [
      pluralise(choices.length, 'choice'),
      events.length > 0 ? pluralise(events.length, 'event') : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <div
        className={styles.nodeWrapper}
        onMouseEnter={() => setHoveredPageId(id)}
        onMouseLeave={() => setHoveredPageId(null)}
      >
        {/* 4 invisible target handles — one per side for floating edge routing */}
        <Handle type="target" position={Position.Top} id="t-top" style={HIDDEN} />
        <Handle type="target" position={Position.Bottom} id="t-bottom" style={HIDDEN} />
        <Handle type="target" position={Position.Left} id="t-left" style={HIDDEN} />
        <Handle type="target" position={Position.Right} id="t-right" style={HIDDEN} />

        <article
          className={styles.card}
          data-plot={isPlot || undefined}
          data-unwritten={unwritten || undefined}
        >
          <p className={styles.kicker} data-editing={isEditing || undefined}>
            {atmosphereColor && (
              <span
                className={styles.atmosphereDot}
                style={{ backgroundColor: atmosphereColor }}
                aria-hidden="true"
              />
            )}
            {kicker}
          </p>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.meta}>{meta}</p>
        </article>

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
