import React from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { useRailCounts } from '../../hooks/view/useRailCounts';
import { useLastSavedLabel } from '../../hooks/view/useLastSavedLabel';
import { RAIL_SECTIONS } from './railConfig';
import styles from './EditorRail.module.css';

/**
 * The editor's navigation column. Every item names a workspace that exists;
 * `activeWorkspace` is both what it writes and what it reads back to show the
 * current place.
 */
export const EditorRail: React.FC = React.memo(() => {
  const { activeWorkspace, setActiveWorkspace } = useActiveWorkspace();
  const counts = useRailCounts();
  const lastSavedLabel = useLastSavedLabel();

  return (
    <nav className={styles.rail} aria-label="Editor sections">
      {RAIL_SECTIONS.map((section) => (
        <section key={section.heading} className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          <ul className={styles.list}>
            {section.items.map((item) => {
              const isActive = activeWorkspace === item.workspace;
              const Icon = item.icon;
              return (
                <li key={item.workspace}>
                  <button
                    type="button"
                    className={styles.item}
                    data-active={isActive || undefined}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setActiveWorkspace(item.workspace)}
                  >
                    <Icon className={styles.icon} aria-hidden="true" />
                    <span className={styles.label}>{item.label}</span>
                    {item.countKey !== undefined && (
                      <span className={styles.count}>{counts[item.countKey]}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className={styles.footer}>{lastSavedLabel}</p>
    </nav>
  );
});
