import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Bug, PanelRightClose } from 'lucide-react';
import { DebugVariablesTab } from './DebugVariablesTab';
import { DebugInventoryTab } from './DebugInventoryTab';
import { DebugPagesTab } from './DebugPagesTab';
import { DebugSnapshotsTab } from './DebugSnapshotsTab';
import type { PlayerDebugBridge } from './PlayerDebugBridge';
import styles from './DebugConsole.module.css';

/**
 * The author's console, docked beside the book.
 *
 * Docked rather than floating on purpose: it is meant to be read *while* the
 * story is, and an overlay would cover the ledger it is there to explain. Closed,
 * it collapses to a rail so the book gets the full desk back.
 */
export const PlayerDebugConsole: React.FC<PlayerDebugBridge> = (bridge) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        className={styles.rail}
        onClick={() => setIsOpen(true)}
        title="Open the debug console"
        aria-label="Open the debug console"
      >
        <Bug size={15} />
        <span className={styles.railLabel}>Debug</span>
      </button>
    );
  }

  return (
    <aside className={styles.console} aria-label="Debug console">
      <header className={styles.head}>
        <span className={styles.kicker}>Debug</span>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setIsOpen(false)}
          aria-label="Close the debug console"
        >
          <PanelRightClose size={15} />
        </button>
      </header>

      <Tabs.Root className={styles.tabsRoot} defaultValue="variables">
        <Tabs.List className={styles.tabList}>
          <Tabs.Trigger className={styles.tabTrigger} value="variables">Vars</Tabs.Trigger>
          <Tabs.Trigger className={styles.tabTrigger} value="inventory">Items</Tabs.Trigger>
          <Tabs.Trigger className={styles.tabTrigger} value="pages">Pages</Tabs.Trigger>
          <Tabs.Trigger className={styles.tabTrigger} value="snapshots">States</Tabs.Trigger>
        </Tabs.List>

        <div className={styles.tabContent}>
          <Tabs.Content value="variables"><DebugVariablesTab /></Tabs.Content>
          <Tabs.Content value="inventory"><DebugInventoryTab /></Tabs.Content>
          <Tabs.Content value="pages"><DebugPagesTab /></Tabs.Content>
          <Tabs.Content value="snapshots"><DebugSnapshotsTab {...bridge} /></Tabs.Content>
        </div>
      </Tabs.Root>
    </aside>
  );
};
