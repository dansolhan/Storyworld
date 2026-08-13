import React from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { useRailCounts } from '../../hooks/view/useRailCounts';
import { useLastSavedLabel } from '../../hooks/view/useLastSavedLabel';
import { RAIL_SECTIONS } from './railConfig';
import { RailPlots } from './RailPlots';
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
      {/*
        Plots sit between STORY and DATA: they are places on the canvas, not a
        collection you edit, so they belong with the navigation rather than the data.
      */}
      {RAIL_SECTIONS.map((section, index) => (
        <React.Fragment key={section.heading}>
        {index === 1 && <RailPlots />}
        <section key={section.heading} className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          <ul className={styles.list}>
            {section.items.map((item) => {
              const isActive = activeWorkspace === item.workspace;
              const Icon = item.icon;
              const count = item.countKey === undefined ? undefined : counts[item.countKey];
              return (
                <li key={item.workspace}>
                  <button
                    type="button"
                    className={styles.item}
                    data-active={isActive || undefined}
                    aria-current={isActive ? 'page' : undefined}
                    /*
                     * The label and count sit in adjacent elements with no
                     * whitespace between them, which a screen reader would
                     * otherwise read as "Items1".
                     */
                    aria-label={count === undefined ? undefined : `${item.label}, ${count}`}
                    onClick={() => setActiveWorkspace(item.workspace)}
                  >
                    <Icon className={styles.icon} aria-hidden="true" />
                    <span className={styles.label}>{item.label}</span>
                    {count !== undefined && <span className={styles.count}>{count}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        </React.Fragment>
      ))}

      <p className={styles.footer}>{lastSavedLabel}</p>
    </nav>
  );
});
