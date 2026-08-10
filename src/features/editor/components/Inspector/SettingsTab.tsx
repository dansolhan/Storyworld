import React from 'react';
import { usePageActions } from '../../hooks/page/usePageActions';
import { useAtmospheres } from '../../hooks/page/useAtmospheres';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page, PageType } from '../../../../domain/Page/Page';
import styles from './InspectorTabs.module.css';

export interface SettingsTabProps {
  page: Page;
}

/** What the page is, rather than what it says. */
export const SettingsTab: React.FC<SettingsTabProps> = ({ page }) => {
  const { updatePageTitle, updatePageType, updatePageAtmosphere } = usePageActions();
  const atmospheres = useAtmospheres();
  const startPageId = useEditorStore((state) => state.startPageId);
  const setStartPageId = useEditorStore((state) => state.setStartPageId);

  const isStartPage = startPageId === page.id;

  return (
    <div className={styles.tab}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Title</span>
        <input
          type="text"
          className={styles.input}
          value={page.title}
          placeholder="e.g. The Dark Forest"
          onChange={(event) => updatePageTitle(page.id, event.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Type</span>
        <select
          className={styles.input}
          value={page.type || 'location'}
          onChange={(event) => updatePageType(page.id, event.target.value as PageType)}
        >
          <option value="location">Location</option>
          <option value="plot">Plot / Action</option>
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Atmosphere</span>
        <select
          className={styles.input}
          value={page.atmosphereId || ''}
          onChange={(event) => updatePageAtmosphere(page.id, event.target.value || undefined)}
        >
          <option value="">None</option>
          {Object.entries(atmospheres).map(([id, atmosphere]) => (
            <option key={id} value={id}>
              {atmosphere.title}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Start page</span>
        <button
          type="button"
          className={styles.rowButton}
          data-active={isStartPage || undefined}
          onClick={() => setStartPageId(isStartPage ? null : page.id)}
        >
          {isStartPage ? 'The story starts here' : 'Start the story here'}
        </button>
      </div>

      <p className={styles.pageId}>{page.id}</p>
    </div>
  );
};
