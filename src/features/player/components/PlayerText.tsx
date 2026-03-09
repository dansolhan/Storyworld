import React from 'react';
import { parseTextTokens } from '../../../utils/textParser';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCurrentPage, useVisibleParagraphs } from '../hooks/useStoryState';
import { usePageId } from '../context/PageContext';
import styles from '../Player.module.css';

export const PlayerText: React.FC = () => {
  const currentPage = useCurrentPage();
  const paragraphs = useVisibleParagraphs();
  const variables = usePlayerStore((s) => s.variables);
  const allMessages = usePlayerStore((s) => s.messages);
  const contextPageId = usePageId();

  if (!currentPage) return null;

  // Only show messages associated with the current page context
  const filteredMessages = allMessages.filter(m => !m.pageId || m.pageId === contextPageId);

  return (
    <div className={styles.textContent}>
      <h2 className={styles.pageTitle}>{currentPage.title}</h2>

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
        {filteredMessages.map((m) => {
          const parsedHtml = parseTextTokens(m.text, variables);
          const isStyled = m.displayStyle !== 'paragraph';

          return (
            <div
              key={m.id}
              className={`${styles.paragraphText} ${isStyled ? styles.messageText : ''}`}
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
            />
          );
        })}
      </div>
    </div>
  );
};
