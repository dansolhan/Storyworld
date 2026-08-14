import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '../../../components/ui/Dialog/Dialog';
import { Button } from '../../../components/ui/Button/Button';
import { relativeTime } from '../../../utils/relativeTime';
import { upgradedFrom } from '../upgradedFrom';
import type { StorySummary } from '../storySummary';

export interface RevertStoryDialogProps {
  story: StorySummary | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

/**
 * Confirms going back to the pre-upgrade copy.
 *
 * This one asks first, where deleting a page does not: a page delete is undoable and
 * this is not — reverting replaces the current story, and everything written since the
 * upgrade goes with it. So the dialog says exactly what is being traded.
 */
export const RevertStoryDialog: React.FC<RevertStoryDialogProps> = ({
  story,
  onCancel,
  onConfirm,
}) => (
  <Dialog open={story !== null} onOpenChange={(open) => (open ? undefined : onCancel())}>
    {story?.backup && (
      <DialogContent
        title={`Revert “${story.title}”?`}
        description={`This puts the story back as it was before it was upgraded from ${upgradedFrom(
          story.backup.fromVersion
        )}, ${relativeTime(
          story.backup.takenAt
        )}. Anything written since then is lost — export the story first if you want to keep both.`}
        width={460}
      >
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Keep the current version
            </Button>
          </DialogClose>
          <Button variant="danger" type="button" onClick={() => onConfirm(story.id)}>
            Revert
          </Button>
        </DialogFooter>
      </DialogContent>
    )}
  </Dialog>
);
