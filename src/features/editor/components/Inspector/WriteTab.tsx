import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useParagraphActions } from '../../hooks/page/useParagraphActions';
import { ParagraphBlock } from './ParagraphBlock';
import type { Page } from '../../../../domain/Page/Page';
import styles from './InspectorTabs.module.css';

export interface WriteTabProps {
  page: Page;
}

/** The page's prose. Settings that used to share this scroll now have their own tab. */
export const WriteTab: React.FC<WriteTabProps> = ({ page }) => {
  const { addParagraph, updateParagraph } = useParagraphActions();

  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('[data-popover="true"]')) return;
      if (listRef.current && !listRef.current.contains(target as Node)) setActiveId(null);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const toggleLock = useCallback((paragraphId: string) => {
    setLockedIds((previous) => {
      const next = new Set(previous);
      if (next.has(paragraphId)) next.delete(paragraphId);
      else next.add(paragraphId);
      return next;
    });
  }, []);

  const activate = useCallback(
    (paragraphId: string, element: HTMLDivElement) => {
      if (activeId === paragraphId) return;
      setActiveId(paragraphId);
      // Let the block finish expanding before scrolling it into view.
      setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    },
    [activeId]
  );

  return (
    <div className={styles.tab}>
      <div className={styles.list} ref={listRef}>
        {page.paragraphs.length === 0 && (
          <p className={styles.empty}>Nothing written yet.</p>
        )}
        {page.paragraphs.map((paragraph) => (
          <ParagraphBlock
            key={paragraph.id}
            paragraph={paragraph}
            pageId={page.id}
            isLocked={lockedIds.has(paragraph.id)}
            isActive={activeId === paragraph.id}
            onActivate={activate}
            onToggleLock={toggleLock}
            onChange={updateParagraph}
          />
        ))}
      </div>

      <button type="button" className={styles.addRow} onClick={() => addParagraph(page.id)}>
        <Plus className={styles.addIcon} aria-hidden="true" />
        Add paragraph
      </button>
    </div>
  );
};
