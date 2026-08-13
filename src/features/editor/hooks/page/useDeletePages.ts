import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useToastStore } from '../../../../components/ui/Toast/useToastStore';
import type { DeletedPage } from '../../store/editorTypes';

const pluralise = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

export interface DeletePages {
  /** Deletes pages by id and offers them back. */
  deletePages: (pageIds: string[]) => void;
  /**
   * Offers back pages something else already deleted.
   *
   * The canvas deletes inside `onNodesChange`, because React Flow hands the removal
   * to the store rather than to a component. It reports what went, and this says the
   * same thing about it as the inspector does.
   */
  announceDeleted: (deleted: DeletedPage[]) => void;
}

/**
 * Deleting a page, undoably — one definition, wherever it is asked for.
 *
 * Deleting a page destroys prose, and there are two ways to ask: the canvas
 * keyboard and the inspector's button. Neither confirms first: a confirmation on
 * every delete makes the ordinary case tedious, and an undo costs nothing when it is
 * not wanted. What matters is that both routes behave identically, which is why the
 * message and the restore live here rather than at each call site.
 */
export const useDeletePages = (): DeletePages => {
  const { deletePage, restoreDeletedPage } = useEditorStore(
    useShallow((state) => ({
      deletePage: state.deletePage,
      restoreDeletedPage: state.restoreDeletedPage,
    }))
  );

  const announceDeleted = useCallback(
    (deleted: DeletedPage[]) => {
      if (deleted.length === 0) return;

      const what =
        deleted.length === 1
          ? `“${deleted[0].page.title || 'Untitled page'}”`
          : pluralise(deleted.length, 'page');

      useToastStore.getState().showToast(`Deleted ${what}.`, {
        label: 'Undo',
        onClick: () => {
          /* Restored in the order they went, so inbound links resolve. */
          for (const page of deleted) restoreDeletedPage(page);
        },
      });
    },
    [restoreDeletedPage]
  );

  const deletePages = useCallback(
    (pageIds: string[]) => {
      const deleted = pageIds
        .map((pageId) => deletePage(pageId))
        .filter((page): page is DeletedPage => page !== undefined);

      announceDeleted(deleted);
    },
    [deletePage, announceDeleted]
  );

  return { deletePages, announceDeleted };
};
