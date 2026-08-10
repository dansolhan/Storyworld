import { useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';

/**
 * Escape backs out of whatever the editor is currently in, one layer at a time:
 * a data workspace, then a pending choice connection, then the page selection.
 *
 * The workspace layer matters more than it looks. Several of the data managers
 * are still true modals that cover the rail, so without this there is no way
 * back to the graph except their own close button — the rail is the navigation
 * model, and it should never be possible to get somewhere it cannot reach.
 * Folding them into the Data workspace removes the trap properly.
 *
 * Ignored while focus is in a text field, and while a Radix dialog is open —
 * there, Escape already belongs to something.
 */
export const useDeselectOnEscape = (): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      const {
        activeWorkspace,
        connectingChoice,
        selectedPageId,
        openDialog,
        setActiveWorkspace,
        setConnectingChoice,
        setSelectedPage,
      } = useEditorStore.getState();

      // Radix owns Escape while one of its dialogs is up.
      if (openDialog !== null) return;

      if (activeWorkspace !== 'graph') {
        setActiveWorkspace('graph');
      } else if (connectingChoice) {
        setConnectingChoice(null);
      } else if (selectedPageId) {
        setSelectedPage(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
