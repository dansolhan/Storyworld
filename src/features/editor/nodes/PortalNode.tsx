import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../store/useEditorStore';
import { subplotColour } from '../../../domain/Story/subplotColour';
import styles from './PortalNode.module.css';

export interface PortalNodeData extends Record<string, unknown> {
  sourcePageId: string;
  sourcePageTitle: string;
  /** The subplot the source page belongs to; drives plot-lane visibility. */
  sourceSubplotId?: string;
  /** The choice that leads across. */
  choiceText: string;
  subplotId: string;
  subplotName: string;
  subplotPageCount: number;
  targetPageName: string;
}

export type PortalNodeType = Node<PortalNodeData, 'portalNode'>;

const HIDDEN: React.CSSProperties = { opacity: 0 };

const pluralise = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * Where the story crosses into another plot.
 *
 * A labelled card rather than the glyph it used to be — 5c's one criticism that
 * survives dropping its lanes: a subplot *should* be abstracted away, but the thing
 * standing in for it has to say what it stands for. So the card names the plot, how
 * many pages are on the other side, the page you arrive at, and the choice that
 * takes you there.
 */
export const PortalNode = React.memo(({ data, id }: NodeProps<PortalNodeType>) => {
  const { setCurrentPlotId, setHoveredPageId, subplots } = useEditorStore(
    useShallow((state) => ({
      setCurrentPlotId: state.setCurrentPlotId,
      setHoveredPageId: state.setHoveredPageId,
      subplots: state.subplots,
    }))
  );

  /* An empty subplot id is a crossing back to the main plot, which has no entry. */
  const targetPlotId = data.subplotId || null;
  const colour = subplotColour(subplots ?? [], targetPlotId);

  return (
    <div
      className={styles.node}
      onDoubleClick={() => setCurrentPlotId(targetPlotId)}
      onMouseEnter={() => setHoveredPageId(id)}
      onMouseLeave={() => setHoveredPageId(null)}
      title="Double-click to follow the crossing"
    >
      {/* 4 invisible target handles — one per side */}
      <Handle type="target" position={Position.Top} id="t-top" style={HIDDEN} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={HIDDEN} />
      <Handle type="target" position={Position.Left} id="t-left" style={HIDDEN} />
      <Handle type="target" position={Position.Right} id="t-right" style={HIDDEN} />

      <p className={styles.kicker}>
        <span className={styles.dot} style={{ backgroundColor: colour }} aria-hidden="true" />
        Crossing to {data.subplotName}
      </p>

      <h3 className={styles.title}>{data.targetPageName}</h3>

      <p className={styles.meta}>
        {pluralise(data.subplotPageCount, 'page')} · from{' '}
        <span className={styles.source}>{data.sourcePageTitle}</span>
        {data.choiceText ? ` · “${data.choiceText}”` : ''}
      </p>
    </div>
  );
});
