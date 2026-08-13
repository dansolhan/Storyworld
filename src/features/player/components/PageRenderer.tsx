import React from 'react';
import { useEngine } from '../adapter/useEngine';
import { useEngineStore } from '../adapter/useEngineStore';
import { parseTextTokens } from '../../../utils/textParser';
import { stripUnresolvedMarks } from '../../../domain/ContextualText/contextualMark';
import { resolveDerivedTokens } from '../../../domain/DerivedText/derivedToken';
import { resolveDerivedText } from '../../../domain/DerivedText/resolveDerivedText';
import styles from '../Player.module.css';

export const PageRenderer: React.FC<{ pageId: string }> = ({ pageId }) => {
  const engine = useEngine();
  const storyData = useEngineStore((s) => s.storyData);
  const variables = useEngineStore((s) => s.variables);
  const messages = useEngineStore((s) => s.messages);
  const visitedPageIds = useEngineStore((s) => s.visitedPageIds);
  const inventory = useEngineStore((s) => s.inventory);

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
  const evalContext = { variables, visitedPageIds, currentPageId: pageId, inventory };

  /*
   * Derived texts resolve before `{{variable}}` substitution, so an outcome can
   * itself contain a token — "the {{title}} nods" is a reasonable thing to write.
   * A token whose derived text has gone resolves to nothing and the sentence closes
   * over it; Story Health names the page.
   */
  const renderProse = (html: string): string => {
    const resolved = resolveDerivedTokens(html, (id) => {
      const derived = (storyData.derivedTexts ?? {})[id];
      return derived ? resolveDerivedText(derived, evalContext) : '';
    });

    return stripUnresolvedMarks(parseTextTokens(resolved, variables), (entryId) =>
      Boolean(entries[entryId])
    )
      .replace(/<\/p>\n/g, '</p>')
      .replace(/<br\s*\/?>\n/g, '<br>');
  };

  const filteredMessages = messages.filter((m) => !m.pageId || m.pageId === pageId);

  const isEnding = engine.getVisibleContent(pageId).choices.length === 0;

  return (
    <div className={styles.textContent}>
      {/*
        The running heads of a printed page: the story on the left, where you are in
        it on the right. "Last page" rather than a chapter number, because a
        branching story has no linear count to give.
      */}
      <div className={styles.runningHead}>
        <span className={styles.headKicker}>{storyData.title || 'Untitled story'}</span>
        <span className={styles.headKicker}>{isEnding ? 'Last page' : 'This page'}</span>
      </div>

      <h2 className={styles.pageTitle}>{page.title}</h2>
      <p className={styles.ornament} aria-hidden="true">─ ✦ ─</p>

      <div className={styles.paragraphs}>
        {paragraphs.map((p, index) => (
          <div
            key={p.id}
            className={styles.paragraphText}
            /* Only the opening paragraph takes the drop cap, as a page would. */
            data-opening={index === 0 || undefined}
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
