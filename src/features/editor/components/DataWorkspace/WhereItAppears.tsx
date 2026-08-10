import React from 'react';
import { useRevealPage } from '../../hooks/view/useRevealPage';
import type { UsageEntry } from '../../usage/usageReference';
import styles from './DetailPanel.module.css';

export interface WhereItAppearsProps {
  usage: UsageEntry;
  /** Heading, since Variables call this READ BY rather than WHERE IT APPEARS. */
  heading?: string;
}

/**
 * The sites that reference an entity, each with the relationship in the words an
 * author would use.
 *
 * Clicking a page reveals it on the graph — you asked where something is used, so
 * this takes you there. Story-level sites (a track behind an atmosphere, a
 * variable in the status ledger) have no page and are listed without a link.
 */
export const WhereItAppears: React.FC<WhereItAppearsProps> = ({
  usage,
  heading = 'Where it appears',
}) => {
  const revealPage = useRevealPage();

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionHeading}>{heading}</h3>

      {usage.references.length === 0 ? (
        <p className={styles.sectionEmpty}>Nothing refers to this yet.</p>
      ) : (
        <ul className={styles.usageList}>
          {usage.references.map((reference, index) => (
            <li key={`${reference.pageId ?? 'story'}-${reference.relationship}-${index}`} className={styles.usageRow}>
              {reference.pageId ? (
                <button
                  type="button"
                  className={styles.usageLink}
                  onClick={() => revealPage({ pageId: reference.pageId! })}
                >
                  {reference.pageTitle || reference.pageId}
                </button>
              ) : (
                <span className={styles.usageStoryLevel}>Story settings</span>
              )}
              <span className={styles.usageRelationship}>{reference.relationship}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
