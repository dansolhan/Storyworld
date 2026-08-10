import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Play } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { useSelectedPageId } from '../../hooks/page/useSelectedPageId';
import { useInspectorTab } from '../../hooks/view/useInspectorTab';
import type { InspectorTab } from '../../store/inspectorTab';
import { InspectorEmpty } from './InspectorEmpty';
import { WriteTab } from './WriteTab';
import { ChoicesTab } from './ChoicesTab';
import { LogicTab } from './LogicTab';
import { SettingsTab } from './SettingsTab';
import styles from './Inspector.module.css';

export interface InspectorProps {
  /** Starts playback from the selected page rather than the story's start. */
  onPlayFromPage: (pageId: string) => void;
}

/**
 * The editor's persistent right column.
 *
 * It replaces a bottom drawer that covered the canvas whenever you edited
 * anything — the change the whole shell exists to make. It keeps its 400px
 * whether or not a page is selected, so selecting and deselecting never
 * reflows the canvas.
 */
export const Inspector: React.FC<InspectorProps> = ({ onPlayFromPage }) => {
  const selectedPageId = useSelectedPageId();
  const selectedPage = useEditorStore((state) => state.pages[selectedPageId || '']);
  const { inspectorTab, setInspectorTab } = useInspectorTab();

  if (!selectedPageId || !selectedPage) {
    return (
      <aside className={styles.inspector} aria-label="Inspector">
        <InspectorEmpty />
      </aside>
    );
  }

  const choiceCount = selectedPage.choices.length;
  const logicCount = (selectedPage.events ?? []).length;

  return (
    <aside className={styles.inspector} aria-label="Inspector">
      <header className={styles.header}>
        <h2 className={styles.title}>{selectedPage.title || 'Untitled Page'}</h2>
        <p className={styles.pageId}>{selectedPageId}</p>
      </header>

      <Tabs.Root
        className={styles.tabsRoot}
        value={inspectorTab}
        onValueChange={(value) => setInspectorTab(value as InspectorTab)}
      >
        <Tabs.List className={styles.tabList}>
          <Tabs.Trigger className={styles.tabTrigger} value="write">
            Write
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabTrigger} value="choices">
            Choices {choiceCount > 0 && <span className={styles.tabCount}>{choiceCount}</span>}
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabTrigger} value="logic">
            Logic {logicCount > 0 && <span className={styles.tabCount}>{logicCount}</span>}
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabTrigger} value="settings">
            Settings
          </Tabs.Trigger>
        </Tabs.List>

        <div className={styles.body}>
          <Tabs.Content value="write">
            <WriteTab page={selectedPage} />
          </Tabs.Content>
          <Tabs.Content value="choices">
            <ChoicesTab page={selectedPage} />
          </Tabs.Content>
          <Tabs.Content value="logic">
            <LogicTab page={selectedPage} />
          </Tabs.Content>
          <Tabs.Content value="settings">
            <SettingsTab page={selectedPage} />
          </Tabs.Content>
        </div>
      </Tabs.Root>

      <footer className={styles.footer}>
        <p className={styles.footerHint}>Esc to deselect</p>
        <button
          type="button"
          className={styles.playFromHere}
          onClick={() => onPlayFromPage(selectedPageId)}
        >
          <Play className={styles.playIcon} aria-hidden="true" />
          Play from here
        </button>
      </footer>
    </aside>
  );
};
