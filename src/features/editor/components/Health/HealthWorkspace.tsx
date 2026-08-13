import React from 'react';
import { useHealthReport } from '../../hooks/data/useHealthReport';
import { useRevealPage } from '../../hooks/view/useRevealPage';
import { HealthCheckGroup } from './HealthCheckGroup';
import styles from './HealthWorkspace.module.css';

const pluralise = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * Everything derivable about the story's health, grouped by check.
 *
 * Nothing here is stored — the report is computed from the same collections the
 * rest of the editor edits, so it cannot go stale and there is no "re-run
 * checks" button to press.
 */
export const HealthWorkspace: React.FC = () => {
  const report = useHealthReport();
  const revealPage = useRevealPage();

  const summary =
    report.breakingCount > 0
      ? `${pluralise(report.breakingCount, 'thing')} to fix before a reader sees this.`
      : report.totalCount > 0
        ? 'Nothing broken. The rest is drafting.'
        : 'Nothing to report.';

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Story health</h1>
          <p className={styles.explanation}>{summary}</p>
        </div>

        <p className={styles.tally}>
          <span className={styles.tallyFigure} data-severity={report.breakingCount > 0 ? 'breaks' : undefined}>
            {report.breakingCount}
          </span>
          <span className={styles.tallyLabel}>breaking</span>
          <span className={styles.tallyFigure}>{report.totalCount - report.breakingCount}</span>
          <span className={styles.tallyLabel}>to look at</span>
        </p>
      </header>

      <div className={styles.body}>
        {report.checks.map((check) => (
          <HealthCheckGroup
            key={check.id}
            check={check}
            onReveal={(pageId) => revealPage({ pageId })}
          />
        ))}
      </div>
    </div>
  );
};
