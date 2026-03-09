import React, { useEffect } from 'react';
import type { Choice } from '../../../domain/Choice/Choice';
import { Button } from '../../../components/ui/Button/Button';
import styles from '../Player.module.css';

export interface PlayerChoicesProps {
  choices: Choice[];
  onChoiceClick: (choiceId: string, targetPageId?: string) => void;
  onRestart: () => void;
}

export const PlayerChoices: React.FC<PlayerChoicesProps> = ({ choices, onChoiceClick, onRestart }) => {
  const handleChoiceSelect = (choice: Choice) => {
    onChoiceClick(choice.id, choice.targetPageId);
  };

  // Keyboard shortcuts: press 1-9 to select a choice
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
  }, [choices]);

  return (
    <div className={styles.choicesContainer}>
      {choices && choices.length > 0 ? (
        <ol className={styles.choicesList}>
          {choices.map((choice, idx) => (
            <li key={choice.id} className={styles.choiceItem}>
              <button
                className={styles.choiceButton}
                onClick={() => handleChoiceSelect(choice)}
              >
                <span className={styles.choiceNumber}>[{idx + 1}]</span>
                <span className={styles.choiceArrow}>▶</span>
                <span className={styles.choiceText}>{choice.text}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.endContainer}>
          <p className={styles.endText}>— The End —</p>
          <Button variant="secondary" size="lg" onClick={onRestart}>
            Restart Story
          </Button>
        </div>
      )}
    </div>
  );
};
