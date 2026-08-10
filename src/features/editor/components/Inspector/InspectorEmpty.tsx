import React from 'react';
import { useStorySummary } from '../../hooks/story/useStorySummary';
import styles from './InspectorEmpty.module.css';

const plural = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * What the inspector shows with nothing selected.
 *
 * The column is structural now, not a drawer, so it keeps its width whether or
 * not a page is selected — clicking empty canvas should not reflow the whole
 * editor. Story-level facts give the space a reason to exist at rest.
 */
export const InspectorEmpty: React.FC = () => {
  const summary = useStorySummary();

  const facts = [
    plural(summary.pageCount, 'page'),
    plural(summary.choiceCount, 'choice'),
    summary.subplotCount > 0 ? plural(summary.subplotCount, 'subplot') : null,
    summary.deadEndCount > 0 ? `${summary.deadEndCount} without choices` : null,
  ].filter(Boolean) as string[];

  return (
    <div className={styles.empty}>
      <p className={styles.kicker}>The story so far</p>
      <h2 className={styles.title}>{summary.title || 'Untitled story'}</h2>

      {summary.description && <p className={styles.description}>{summary.description}</p>}

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <dd key={fact} className={styles.fact}>
            {fact}
          </dd>
        ))}
      </dl>

      <p className={styles.startPage}>
        {summary.startPageTitle
          ? `Begins at ${summary.startPageTitle}`
          : 'No start page chosen yet'}
      </p>

      <p className={styles.hint}>Select a page to edit it.</p>
    </div>
  );
};
