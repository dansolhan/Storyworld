import React, { useState } from 'react';
import { Crosshair, Plus } from 'lucide-react';
import { useChoiceActions } from '../../hooks/page/useChoiceActions';
import { useBranchToNewPage } from '../../hooks/page/useBranchToNewPage';
import { useConnectingChoice } from '../../hooks/page/useConnectingChoice';
import { useRevealPage } from '../../hooks/view/useRevealPage';
import { hasShortcutModifier, shortcutLabel } from '../../../../utils/platform';
import { useEditorStore } from '../../store/useEditorStore';
import { RuleEditor } from '../RuleEditor/RuleEditor';
import type { Page } from '../../../../domain/Page/Page';
import styles from './InspectorTabs.module.css';

export interface ChoicesTabProps {
  page: Page;
}

/**
 * The page's outbound choices.
 *
 * A row per choice with its target, a retarget control and its logic. `⌘⏎` while
 * writing a choice branches straight to a new page, so an author can outline a
 * whole fork without leaving this list — see `useBranchToNewPage`.
 */
export const ChoicesTab: React.FC<ChoicesTabProps> = ({ page }) => {
  const { addChoice, updateChoiceText, setConnectingChoice } = useChoiceActions();
  const branchToNewPage = useBranchToNewPage();
  const connectingChoice = useConnectingChoice();
  const pages = useEditorStore((state) => state.pages);
  const revealRequest = useEditorStore((state) => state.revealRequest);
  const revealPage = useRevealPage();

  const [manualChoiceId, setManualChoiceId] = useState<string | null>(null);
  const [lastRevealed, setLastRevealed] = useState(revealRequest?.choiceId);

  const revealedChoiceId = revealRequest?.pageId === page.id ? revealRequest.choiceId : undefined;
  if (revealedChoiceId !== lastRevealed) {
    // A fresh reveal supersedes whatever was clicked before it.
    setLastRevealed(revealedChoiceId);
    setManualChoiceId(null);
  }
  const activeChoiceId = manualChoiceId ?? revealedChoiceId ?? null;

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
              onClick={() => setManualChoiceId(choice.id)}
              onFocusCapture={() => setManualChoiceId(choice.id)}
            >
              <input
                type="text"
                className={styles.choiceText}
                value={choice.text}
                onChange={(event) => updateChoiceText(page.id, choice.id, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || !hasShortcutModifier(event)) return;
                  // Plain Enter is left alone: it does nothing in a single-line input,
                  // and claiming it would make a stray keystroke create a page.
                  event.preventDefault();
                  branchToNewPage(page.id, choice.id);
                }}
                placeholder={`Choice ${index + 1}...`}
                title={`${shortcutLabel('⏎')} branches to a new page`}
              />

              <div className={styles.choiceTarget}>
                {choice.targetPageId ? (
                  <button
                    type="button"
                    className={styles.targetLink}
                    onClick={() => revealPage({ pageId: choice.targetPageId! })}
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
                    onClick={() => branchToNewPage(page.id, choice.id)}
                  >
                    To new page
                  </button>
                </div>
              </div>

              <RuleEditor
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
