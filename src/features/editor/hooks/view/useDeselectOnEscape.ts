import { useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';

/**
 * Escape clears the selection, as the inspector footer promises.
 *
 * Ignored while focus is in a text field or a dialog is open — there, Escape
 * belongs to whatever the reader is actually in the middle of.
 */
export const useDeselectOnEscape = (): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;

      const { selectedPageId, connectingChoice, setSelectedPage, setConnectingChoice } =
        useEditorStore.getState();

      if (connectingChoice) {
        setConnectingChoice(null);
      } else if (selectedPageId) {
        setSelectedPage(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
