import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogClose } from '../../../../components/ui/Dialog/Dialog';
import { Button } from '../../../../components/ui/Button/Button';
import type { UsageEntry } from '../../usage/usageReference';

export interface DeleteEntityDialogProps {
  /** The thing being deleted, e.g. "Rusty Key". */
  name: string;
  /** What kind of thing, for the sentence: "item", "variable". */
  kind: string;
  usage: UsageEntry;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const plural = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * Confirms a delete, saying what depends on it first.
 *
 * It warns rather than blocks: tearing down the references is often exactly what
 * an author is in the middle of, and Story Health reports what is left dangling.
 * Replaces `window.confirm`, which could not say any of this.
 */
export const DeleteEntityDialog: React.FC<DeleteEntityDialogProps> = ({
  name,
  kind,
  usage,
  isOpen,
  onCancel,
  onConfirm,
}) => {
  const { pageCount, references } = usage;

  const consequence =
    references.length === 0
      ? `Nothing refers to this ${kind}.`
      : pageCount > 0
        ? `It is used on ${plural(pageCount, 'page')}. Those references will stop resolving.`
        : `It is referred to from story settings. That reference will stop resolving.`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent title={`Delete “${name}”?`} description={consequence} width={420}>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button variant="danger" type="button" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
