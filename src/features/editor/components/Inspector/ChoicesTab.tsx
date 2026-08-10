import React, { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Crosshair, Plus } from 'lucide-react';
import { useChoiceActions } from '../../hooks/page/useChoiceActions';
import { useConnectingChoice } from '../../hooks/page/useConnectingChoice';
import { usePageActions } from '../../hooks/page/usePageActions';
import { useEditorStore } from '../../store/useEditorStore';
import { EventsEditor } from '../EventsEditor/EventsEditor';
import type { Page } from '../../../../domain/Page/Page';
import styles from './InspectorTabs.module.css';

export interface ChoicesTabProps {
  page: Page;
}

/**
 * The page's outbound choices.
 *
 * Structure follows the design — a row per choice with its target, a retarget
 * control and its logic. The choice-first shortcuts it also draws (⌘⏎ to
 * create and link a page, the unwritten-node treatment, the undo toast) belong
 * to their own step and are deliberately absent rather than half-built.
 */
export const ChoicesTab: React.FC<ChoicesTabProps> = ({ page }) => {
  const { addChoice, updateChoiceText, setConnectingChoice, createPageFromChoice } = useChoiceActions();
  const { setSelectedPage } = usePageActions();
  const connectingChoice = useConnectingChoice();
  const pages = useEditorStore((state) => state.pages);
  const { fitView, setNodes } = useReactFlow();

  const [activeChoiceId, setActiveChoiceId] = useState<string | null>(null);

  const revealTarget = useCallback(
    (targetPageId: string) => {
      setSelectedPage(targetPageId);
      setNodes((nodes) => nodes.map((node) => ({ ...node, selected: node.id === targetPageId })));
      setTimeout(() => fitView({ nodes: [{ id: targetPageId }], duration: 800, maxZoom: 1 }), 50);
    },
    [setSelectedPage, setNodes, fitView]
  );

  return (
    <div className={styles.tab}>
      <div className={styles.list}>
        {page.choices.length === 0 && (
          <p className={styles.empty}>
            End of the line. Add a choice to carry the reader onward, or mark this page as an ending.
          </p>
        )}

        {page.choices.map((choice, index) => {
          const isConnecting = connectingChoice?.choiceId === choice.id;
          const isActive = activeChoiceId === choice.id || isConnecting;
          const targetTitle = choice.targetPageId ? pages[choice.targetPageId]?.title : undefined;

          return (
            <div
              key={choice.id}
              className={styles.choice}
              data-active={isActive || undefined}
              onClick={() => setActiveChoiceId(choice.id)}
              onFocusCapture={() => setActiveChoiceId(choice.id)}
            >
              <input
                type="text"
                className={styles.choiceText}
                value={choice.text}
                onChange={(event) => updateChoiceText(page.id, choice.id, event.target.value)}
                placeholder={`Choice ${index + 1}...`}
              />

              <div className={styles.choiceTarget}>
                {choice.targetPageId ? (
                  <button
                    type="button"
                    className={styles.targetLink}
                    onClick={() => revealTarget(choice.targetPageId!)}
                    title="Show on canvas"
                  >
                    <Crosshair className={styles.rowIcon} aria-hidden="true" />
                    {targetTitle ?? choice.targetPageId}
                  </button>
                ) : (
                  <span className={styles.targetMissing}>No target page</span>
                )}

                <div className={styles.choiceActions}>
                  <button
                    type="button"
                    className={styles.rowButton}
                    data-active={isConnecting || undefined}
                    onClick={() =>
                      setConnectingChoice(
                        isConnecting ? null : { sourcePageId: page.id, choiceId: choice.id }
                      )
                    }
                  >
                    {isConnecting ? 'Cancel' : choice.targetPageId ? 'Retarget' : 'To existing'}
                  </button>
                  <button
                    type="button"
                    className={styles.rowButton}
                    onClick={() => createPageFromChoice(page.id, choice.id)}
                  >
                    To new page
                  </button>
                </div>
              </div>

              <EventsEditor
                targetType="choice"
                pageId={page.id}
                targetId={choice.id}
                events={choice.events || []}
              />
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.addRow} onClick={() => addChoice(page.id)}>
        <Plus className={styles.addIcon} aria-hidden="true" />
        Add choice
      </button>
    </div>
  );
};
