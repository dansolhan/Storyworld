import { useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { hasShortcutModifier } from '../../../../utils/platform';

/**
 * Opens the command palette on Ctrl+K or ⌘K.
 *
 * Bound while the editor is mounted and nowhere else — it searches one story's
 * contents, which only the editor has open. It fires even from inside a text
 * field: the whole point is to leave whatever you were typing.
 */
export const usePaletteShortcut = (): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !hasShortcutModifier(event)) return;

      event.preventDefault();
      const { openDialog, setOpenDialog } = useEditorStore.getState();
      setOpenDialog(openDialog === 'palette' ? null : 'palette');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
