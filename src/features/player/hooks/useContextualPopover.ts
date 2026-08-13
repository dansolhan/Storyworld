import { useEffect } from 'react';
import { usePlayerUIStore } from '../adapter/usePlayerUI';
import { useEngineStore } from '../adapter/useEngineStore';
import { CONTEXT_ID_ATTR, CONTEXT_MARK_CLASS } from '../../../domain/ContextualText/contextualMark';

/**
 * Opens the reader's popover for a marked phrase.
 *
 * The mark carries only an id, so the note is looked up in the story rather than
 * read off the DOM. That is the point of the shared collection: one edit changes
 * every place the entry is marked, and the prose holds no stale copy.
 */
export const useContextualPopover = () => {
  const setContextualPopover = usePlayerUIStore((s) => s.setContextualPopover);
  const entries = useEngineStore((s) => s.storyData?.contextualText);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains(CONTEXT_MARK_CLASS)) {
        const entryId = target.getAttribute(CONTEXT_ID_ATTR);
        const entry = entryId ? (entries ?? {})[entryId] : undefined;
        if (entry?.text) {
          const rect = target.getBoundingClientRect();
          setContextualPopover({
            text: entry.text,
            title: entry.title,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      } else {
        if (!target.closest('[class*="contextMenu"]') && !target.closest('[class*="popover"]')) {
          setContextualPopover(null);
        }
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [setContextualPopover, entries]);
};
