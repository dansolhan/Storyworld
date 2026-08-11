import React from 'react';
import { RuleEditor } from '../RuleEditor/RuleEditor';
import type { Page } from '../../../../domain/Page/Page';
import styles from './InspectorTabs.module.css';

export interface LogicTabProps {
  page: Page;
}

/**
 * Rules attached to the page itself, as prose.
 *
 * The editor titles its own sections by the moment each set of rules runs at, so
 * there is no kicker here — one would have contradicted the headings below it.
 */
export const LogicTab: React.FC<LogicTabProps> = ({ page }) => (
  <div className={styles.tab}>
    <RuleEditor targetType="page" pageId={page.id} targetId={page.id} events={page.events || []} />
  </div>
);
