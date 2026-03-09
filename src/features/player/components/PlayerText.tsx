import React from 'react';
import type { Paragraph } from '../../../domain/Paragraph/Paragraph';
import type { StoryVariable } from '../../../domain/Story/Variable';
import { parseTextTokens } from '../../../utils/textParser';
import styles from '../Player.module.css';

export interface PlayerTextProps {
  title: string;
  paragraphs: Paragraph[];
  variables: Record<string, StoryVariable>;
}

export const PlayerText: React.FC<PlayerTextProps> = ({ title, paragraphs, variables }) => {
  return (
    <div className={styles.textContent}>
      <h2 className={styles.pageTitle}>{title}</h2>

      <div className={styles.paragraphs}>
        {paragraphs.map((p) => {
          const parsedHtml = parseTextTokens(p.text, variables);
          return (
            <div
              key={p.id}
              className={styles.paragraphText}
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
            />
          );
        })}
      </div>
    </div>
  );
};
