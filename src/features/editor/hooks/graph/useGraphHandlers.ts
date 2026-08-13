import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useToastStore } from '../../../../components/ui/Toast/useToastStore';
import type { OnNodesChange } from '@xyflow/react';
import type { EditorNode } from '../../store/editorTypes';

const pluralise = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

export const useGraphHandlers = () => {
  const { onNodesChange, onEdgesChange, onConnect, restoreDeletedPage } = useEditorStore(
    useShallow((state) => ({
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      restoreDeletedPage: state.restoreDeletedPage,
    }))
  );

  /**
   * Deleting a page destroys its prose, so it is always offered back.
   *
   * The canvas has no confirmation step — a keystroke removes a node — and asking
   * before every delete would make the ordinary case tedious. An undo costs nothing
   * when it is not wanted and everything when it is.
   */
  const handleNodesChange = useCallback<OnNodesChange<EditorNode>>(
    (changes) => {
      const deleted = onNodesChange(changes);
      if (deleted.length === 0) return;

      const what =
        deleted.length === 1 ? `“${deleted[0].page.title || 'Untitled page'}”` : pluralise(deleted.length, 'page');

      useToastStore.getState().showToast(`Deleted ${what}.`, {
        label: 'Undo',
        onClick: () => {
          /* Restored in the order they were removed, so inbound links resolve. */
          for (const page of deleted) restoreDeletedPage(page);
        },
      });
    },
    [onNodesChange, restoreDeletedPage]
  );

  return { onNodesChange: handleNodesChange, onEdgesChange, onConnect };
};
