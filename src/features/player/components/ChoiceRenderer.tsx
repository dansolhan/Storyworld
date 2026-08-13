import React, { useEffect } from 'react';
import { useEngine } from '../adapter/useEngine';
import { usePlayerUIStore } from '../adapter/usePlayerUI';
import { useChoiceSound } from '../hooks/useChoiceSound';
import styles from '../Player.module.css';
import type { Choice } from '../../../domain/Choice/Choice';

export interface ChoiceRendererProps {
  pageId: string;
  /** Offered at the end of the story, beside "Begin again". */
  onExit?: () => void;
}

export const ChoiceRenderer: React.FC<ChoiceRendererProps> = ({ pageId, onExit }) => {
  const engine = useEngine();
  const { play: playClickSound } = useChoiceSound();
  const setTransitioning = usePlayerUIStore((s) => s.setTransitioning);
  const { choices } = engine.getVisibleContent(pageId);
  
  const handleChoiceSelect = (choice: Choice) => {
    playClickSound();
    setTransitioning(true);
    setTimeout(() => {
        engine.dispatch({ 
            type: 'SELECT_CHOICE', 
            payload: { choiceId: choice.id, targetPageId: choice.targetPageId } 
        });
        setTransitioning(false);
    }, 250);
  };

  useEffect(() => {
    if (!choices || choices.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= choices.length) {
        handleChoiceSelect(choices[num - 1]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choices]);

  /*
   * A colophon page, per 6b: the rule, THE END, and two ways on. Deliberately no
   * statistics and no ending count — the ledger keeps showing exactly what it
   * showed during play, which is the whole point of not summarising.
   */
  if (!choices || choices.length === 0) {
    return (
      <div className={styles.endContainer}>
        <p className={styles.endText}>The End</p>
        <div className={styles.endActions}>
          <button
            type="button"
            className={styles.endPrimary}
            onClick={() => engine.dispatch({ type: 'RESTART' })}
          >
            Begin again
          </button>
          {onExit && (
            <button type="button" className={styles.endSecondary} onClick={onExit}>
              Back to the editor
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.choicesContainer}>
      <ol className={styles.choicesList}>
        {choices.map((choice, idx) => (
          <li key={choice.id} className={styles.choiceItem}>
            <button 
              className={styles.choiceButton} 
              onClick={() => handleChoiceSelect(choice)}
              onMouseEnter={() => engine.dispatch({ type: 'HOVER_CHOICE', payload: { choiceId: choice.id, isHovering: true } })}
              onMouseLeave={() => engine.dispatch({ type: 'HOVER_CHOICE', payload: { choiceId: choice.id, isHovering: false } })}
            >
              {/* A numbered line, as a gamebook sets its choices. */}
              <span className={styles.choiceNumber}>{idx + 1}</span>
              <span className={styles.choiceText}>{choice.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
};
