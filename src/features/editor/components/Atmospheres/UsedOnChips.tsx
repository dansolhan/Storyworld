import React, { useState } from 'react';
import { useRevealPage } from '../../hooks/view/useRevealPage';
import type { UsageReference } from '../../usage/usageReference';
import styles from './AtmosphereRow.module.css';

export interface UsedOnChipsProps {
  references: UsageReference[];
  /** How many to show before collapsing the rest behind "+ n more". */
  limit?: number;
}

const DEFAULT_LIMIT = 3;

/** The pages an atmosphere is set on, each a chip that reveals its page. */
export const UsedOnChips: React.FC<UsedOnChipsProps> = ({ references, limit = DEFAULT_LIMIT }) => {
  const revealPage = useRevealPage();
  const [showAll, setShowAll] = useState(false);

  const pages = references.filter((reference) => reference.pageId);
  if (pages.length === 0) {
    return <p className={styles.usedOnEmpty}>Not used on any page.</p>;
  }

  const shown = showAll ? pages : pages.slice(0, limit);
  const hidden = pages.length - shown.length;

  return (
    <div className={styles.usedOn}>
      {shown.map((reference) => (
        <button
          key={reference.pageId}
          type="button"
          className={styles.chip}
          onClick={() => revealPage({ pageId: reference.pageId! })}
        >
          {reference.pageTitle || reference.pageId}
        </button>
      ))}

      {hidden > 0 && (
        <button type="button" className={styles.more} onClick={() => setShowAll(true)}>
          + {hidden} more
        </button>
      )}
    </div>
  );
};
