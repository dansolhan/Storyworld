import { useEffect } from 'react';
import { usePlayerUIStore } from '../adapter/usePlayerUI';

export const useContextualPopover = () => {
  const setContextualPopover = usePlayerUIStore((s) => s.setContextualPopover);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('contextual-text-mark')) {
        const text = target.getAttribute('data-context');
        const title = target.getAttribute('data-title');
        if (text) {
          const rect = target.getBoundingClientRect();
          setContextualPopover({
            text,
            title: title || undefined,
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
  }, [setContextualPopover]);
};
