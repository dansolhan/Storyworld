import React from 'react';
import type { Choice } from '../../../domain/Choice/Choice';
import { Button } from '../../../components/ui/Button/Button';
import styles from '../Player.module.css';

export interface PlayerChoicesProps {
  choices: Choice[];
  onChoiceClick: (choiceId: string, targetPageId?: string) => void;
  onRestart: () => void;
}

export const PlayerChoices: React.FC<PlayerChoicesProps> = ({ choices, onChoiceClick, onRestart }) => {
  return (
    <div className={styles.choicesContainer}>
      {choices && choices.length > 0 ? (
        <div className={styles.choicesList}>
          {choices.map((choice) => (
            <Button
              key={choice.id}
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onChoiceClick(choice.id, choice.targetPageId)}
              className={styles.choiceButton}
            >
              {choice.text}
            </Button>
          ))}
        </div>
      ) : (
        <div className={styles.endContainer}>
          <p className={styles.endText}>You have reached the end of this path.</p>
          <Button variant="secondary" size="lg" onClick={onRestart}>
            Restart Story
          </Button>
        </div>
      )}
    </div>
  );
};
