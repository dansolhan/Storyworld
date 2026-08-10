import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogClose } from '../../../../components/ui/Dialog/Dialog';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import type { StoryVariableType } from '../../../../domain/Story/Variable';
import styles from './NewVariableDialog.module.css';

export interface NewVariableDialogProps {
  isOpen: boolean;
  /** Names already taken, since the name is the key. */
  existingNames: string[];
  onCancel: () => void;
  onCreate: (name: string, type: StoryVariableType) => void;
}

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Naming a new variable.
 *
 * A variable's name *is* its key and cannot be changed afterwards, so it is
 * asked for up front rather than created blank and renamed — and it is validated
 * here, because `{{token}}` only recognises a restricted character set.
 */
export const NewVariableDialog: React.FC<NewVariableDialogProps> = ({
  isOpen,
  existingNames,
  onCancel,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<StoryVariableType>('string');

  const trimmed = name.trim();
  const error =
    trimmed && !NAME_PATTERN.test(trimmed)
      ? 'Letters, numbers and underscores only, starting with a letter.'
      : existingNames.includes(trimmed)
        ? 'A variable with that name already exists.'
        : undefined;

  const close = () => {
    onCancel();
    setName('');
    setType('string');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed || error) return;
    onCreate(trimmed, type);
    setName('');
    setType('string');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent
        title="New variable"
        description="The name is how paragraphs and logic refer to it, and cannot be changed later."
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={name}
            autoFocus
            placeholder="e.g. metGil"
            error={error}
            onChange={(event) => setName(event.target.value)}
          />

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Type</span>
            <select
              className={styles.select}
              value={type}
              onChange={(event) => setType(event.target.value as StoryVariableType)}
            >
              <option value="string">Text</option>
              <option value="number">Number</option>
              <option value="boolean">True / false</option>
            </select>
          </label>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="primary" type="submit" disabled={!trimmed || Boolean(error)}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
