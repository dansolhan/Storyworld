import React, { useEffect } from 'react';
import { useEngine } from '../adapter/EngineContext';
import { usePlayerUIStore } from '../adapter/usePlayerUI';
import { useChoiceSound } from '../hooks/useChoiceSound';
import { Button } from '../../../components/ui/Button/Button';
import styles from '../Player.module.css';
import type { Choice } from '../../../domain/Choice/Choice';

export const ChoiceRenderer: React.FC<{ pageId: string }> = ({ pageId }) => {
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

  if (!choices || choices.length === 0) {
    return (
      <div className={styles.endContainer}>
        <p className={styles.endText}>— The End —</p>
        <Button variant="secondary" size="lg" onClick={() => engine.dispatch({ type: 'RESTART' })}>
          Restart Story
        </Button>
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
              <span className={styles.choiceNumber}>[{idx + 1}]</span>
              <span className={styles.choiceArrow}>▶</span>
              <span className={styles.choiceText}>{choice.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
};
