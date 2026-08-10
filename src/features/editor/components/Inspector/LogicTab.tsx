import React from 'react';
import { EventsEditor } from '../EventsEditor/EventsEditor';
import type { Page } from '../../../../domain/Page/Page';
import styles from './InspectorTabs.module.css';

export interface LogicTabProps {
  page: Page;
}

/**
 * Rules attached to the page itself.
 *
 * This is the existing events editor and logic-tree builder, moved into the
 * inspector and dressed in the new palette. The design replaces the
 * drag-and-drop tree with readable sentences, but that is a rewrite of the
 * presentation with its own step — doing half of it here would mean doing it
 * twice.
 */
export const LogicTab: React.FC<LogicTabProps> = ({ page }) => (
  <div className={styles.tab}>
    <p className={styles.sectionKicker}>When the reader arrives</p>
    <EventsEditor targetType="page" pageId={page.id} targetId={page.id} events={page.events || []} />
  </div>
);
