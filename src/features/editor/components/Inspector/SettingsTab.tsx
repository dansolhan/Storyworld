import React from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { usePageActions } from '../../hooks/page/usePageActions';
import { useDeletePages } from '../../hooks/page/useDeletePages';
import { useAtmospheres } from '../../hooks/page/useAtmospheres';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page, PageType } from '../../../../domain/Page/Page';
import styles from './InspectorTabs.module.css';

export interface SettingsTabProps {
  page: Page;
}

/**
 * What the page is, rather than what it says.
 *
 * The title lives in the Write tab: it is the first thing you write, not a setting.
 */
export const SettingsTab: React.FC<SettingsTabProps> = ({ page }) => {
  const { updatePageType, updatePageAtmosphere } = usePageActions();
  const { deletePages } = useDeletePages();
  const atmospheres = useAtmospheres();
  const startPageId = useEditorStore((state) => state.startPageId);
  const setStartPageId = useEditorStore((state) => state.setStartPageId);

  const isStartPage = startPageId === page.id;

  return (
    <div className={styles.tab}>
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

      {/*
        Below a rule and in the danger outline, so it reads as its own zone rather than
        as one more setting. Outlined rather than filled: colour is a stroke here, and
        the delete is undoable — it should be findable, not frightening.
      */}
      <div className={styles.dangerZone}>
        <Button variant="danger" size="sm" onClick={() => deletePages([page.id])}>
          Delete this page
        </Button>
      </div>
    </div>
  );
};
