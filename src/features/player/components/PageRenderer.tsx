import React from 'react';
import { useEngineStore, useEngine } from '../adapter/EngineContext';
import { parseTextTokens } from '../../../utils/textParser';
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
  const filteredMessages = messages.filter((m) => !m.pageId || m.pageId === pageId);

  return (
    <div className={styles.textContent}>
      <h2 className={styles.pageTitle}>{page.title}</h2>
      <div className={styles.paragraphs}>
        {paragraphs.map((p) => (
          <div
            key={p.id}
            className={styles.paragraphText}
            dangerouslySetInnerHTML={{ 
              __html: parseTextTokens(p.text, variables)
                .replace(/<\/p>\n/g, '</p>')
                .replace(/<br\s*\/?>\n/g, '<br>') 
            }}
          />
        ))}
        {filteredMessages.map((m) => (
          <div
            key={m.id}
            className={`${styles.paragraphText} ${m.displayStyle !== 'paragraph' ? styles.messageText : ''}`}
            dangerouslySetInnerHTML={{ 
              __html: parseTextTokens(m.text, variables)
                .replace(/<\/p>\n/g, '</p>')
                .replace(/<br\s*\/?>\n/g, '<br>') 
            }}
          />
        ))}
      </div>
    </div>
  );
};
