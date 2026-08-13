import { useCallback } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useFramePage } from '../view/useFramePage';
import { useToastStore } from '../../../../components/ui/Toast/useToastStore';

export type BranchToNewPage = (pageId: string, choiceId: string) => void;

/**
 * Creates a page, points a choice at it, and offers to take it back.
 *
 * This is the whole of choice-first branching: an author writes where the reader
 * could go, and the page to write next comes into existence rather than being
 * created and then hunted for. The camera moves but the selection does not — the
 * author is still working through this page's choices.
 *
 * A choice that already had a target is simply repointed. Dropping a link is the
 * kind of thing that needs taking back, which is what the toast is for.
 */
export const useBranchToNewPage = (): BranchToNewPage => {
  const framePage = useFramePage();

  return useCallback(
    (pageId, choiceId) => {
      const { pages, createPageFromChoice } = useEditorStore.getState();
      const choice = pages[pageId]?.choices.find((candidate) => candidate.id === choiceId);
      if (!choice) return;

      const previousTargetId = choice.targetPageId;
      const newPageId = createPageFromChoice(pageId, choiceId);
      if (!newPageId) return;

      framePage(newPageId);

      useToastStore.getState().showToast(
        previousTargetId ? 'New page created, and the choice repointed at it.' : 'New page created.',
        {
          label: 'Undo',
          onClick: () => {
            // Order matters: deleting the page clears any choice naming it, so the
            // old target has to go back afterwards or it would be wiped too.
            const { deletePage, setChoiceDestination } = useEditorStore.getState();
            deletePage(newPageId);
            setChoiceDestination(pageId, choiceId, previousTargetId);
          },
        }
      );
    },
    [framePage]
  );
};
