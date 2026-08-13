import React from 'react';
import { Crosshair, HelpCircle } from 'lucide-react';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import type { HealthCheck } from '../../health/healthFinding';
import styles from './HealthWorkspace.module.css';

export interface HealthCheckGroupProps {
  check: HealthCheck;
  /** Undefined for a finding with no page, which is what makes a row inert. */
  onReveal: (pageId: string) => void;
}

/**
 * One check, with its findings under it.
 *
 * A group with nothing to report still renders, saying so — "every page can be
 * reached" is worth reading, and a group that vanished when it passed would
 * leave the author unsure whether it had run.
 */
export const HealthCheckGroup: React.FC<HealthCheckGroupProps> = ({ check, onReveal }) => (
  <section className={styles.group}>
    <header className={styles.groupHeader}>
      <h2 className={styles.groupTitle}>{check.title}</h2>

      {/*
        Why the check matters, behind an icon rather than under every heading. Ten
        groups of standing explanation crowded out the findings, which are the thing
        worth reading — but the explanation still has to be reachable, so it is a
        focusable button and not a hover-only affordance.
      */}
      <Tooltip content={check.explanation}>
        <button type="button" className={styles.help} aria-label={`What “${check.title}” means`}>
          <HelpCircle className={styles.helpIcon} aria-hidden="true" />
        </button>
      </Tooltip>

      <span
        className={styles.groupCount}
        data-severity={check.findings.length > 0 ? check.severity : undefined}
        data-clear={check.findings.length === 0 || undefined}
      >
        {check.findings.length > 0 ? check.findings.length : '✓'}
      </span>
    </header>

    {check.findings.length === 0 ? (
      <p className={styles.clear}>{check.clear}</p>
    ) : (
      <ul className={styles.findings}>
        {check.findings.map((finding) => (
          <li key={finding.id}>
            {finding.pageId ? (
              <button
                type="button"
                className={styles.finding}
                onClick={() => onReveal(finding.pageId!)}
                title="Show on canvas"
              >
                <Crosshair className={styles.findingIcon} aria-hidden="true" />
                <span className={styles.findingLabel}>{finding.label}</span>
                <span className={styles.findingDetail}>{finding.detail}</span>
              </button>
            ) : (
              <div className={styles.finding} data-inert="true">
                <span className={styles.findingLabel}>{finding.label}</span>
                <span className={styles.findingDetail}>{finding.detail}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    )}
  </section>
);
