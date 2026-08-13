import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '../../../components/ui/Dialog/Dialog';
import { Button } from '../../../components/ui/Button/Button';
import type { StorySummary } from '../storySummary';

export interface DeleteStoryDialogProps {
  story: StorySummary | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

const plural = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * Confirms deleting a whole story, saying how much of it there is.
 *
 * Its own dialog rather than the Data workspace's: what is lost here is the story
 * itself, not a reference to it, so the sentence and the warning are different.
 * Replaces a `window.confirm` that could say neither.
 */
export const DeleteStoryDialog: React.FC<DeleteStoryDialogProps> = ({
  story,
  onCancel,
  onConfirm,
}) => (
  <Dialog open={story !== null} onOpenChange={(open) => (open ? undefined : onCancel())}>
    {story && (
      <DialogContent
        title={`Delete “${story.title}”?`}
        description={`${plural(story.pageCount, 'page')} and ${plural(
          story.choiceCount,
          'choice'
        )}. Autosave lives in this browser only, so there is no copy to fall back on.`}
        width={420}
      >
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Keep it
            </Button>
          </DialogClose>
          <Button variant="danger" type="button" onClick={() => onConfirm(story.id)}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    )}
  </Dialog>
);
