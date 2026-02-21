import { useState, useEffect } from 'react';

export const useContextualPopover = () => {
  const [contextualPopover, setContextualPopover] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('contextual-text-mark')) {
        const text = target.getAttribute('data-context');
        if (text) {
          // Calculate a rough position right below the clicked word
          const rect = target.getBoundingClientRect();
          setContextualPopover({
            text,
            x: rect.left + rect.width / 2, // center horizontally
            y: rect.bottom + 8, // below the text
          });
        }
      } else {
        // Close popover if clicking anywhere else
        setContextualPopover(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return {
    contextualPopover,
    setContextualPopover,
  };
};
