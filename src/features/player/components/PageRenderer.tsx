import React from 'react';
import { useEngine } from '../adapter/useEngine';
import { useEngineStore } from '../adapter/useEngineStore';
import { parseTextTokens } from '../../../utils/textParser';
import { stripUnresolvedMarks } from '../../../domain/ContextualText/contextualMark';
import styles from '../Player.module.css';

export const PageRenderer: React.FC<{ pageId: string }> = ({ pageId }) => {
  const engine = useEngine();
  const storyData = useEngineStore((s) => s.storyData);
  const variables = useEngineStore((s) => s.variables);
  const messages = useEngineStore((s) => s.messages);
  
  if (!storyData) return null;

  const page = storyData.pages.find((p) => p.id === pageId);
  if (!page) return null;

  const { paragraphs } = engine.getVisibleContent(pageId);
  const entries = storyData.contextualText ?? {};

  /*
   * A mark whose entry has gone renders as the words it wrapped. The alternative
   * is a phrase that looks clickable and does nothing, which reads to a reader as
   * a bug rather than as prose. Story Health names them for the author.
   */
  const renderProse = (html: string): string =>
    stripUnresolvedMarks(parseTextTokens(html, variables), (entryId) => Boolean(entries[entryId]))
      .replace(/<\/p>\n/g, '</p>')
      .replace(/<br\s*\/?>\n/g, '<br>');

  const filteredMessages = messages.filter((m) => !m.pageId || m.pageId === pageId);

  return (
    <div className={styles.textContent}>
      <h2 className={styles.pageTitle}>{page.title}</h2>
      <div className={styles.paragraphs}>
        {paragraphs.map((p) => (
          <div
            key={p.id}
            className={styles.paragraphText}
            dangerouslySetInnerHTML={{ __html: renderProse(p.text) }}
          />
        ))}
        {filteredMessages.map((m) => (
          <div
            key={m.id}
            className={`${styles.paragraphText} ${m.displayStyle !== 'paragraph' ? styles.messageText : ''}`}
            dangerouslySetInnerHTML={{ __html: renderProse(m.text) }}
          />
        ))}
      </div>
    </div>
  );
};
