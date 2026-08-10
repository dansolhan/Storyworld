import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Dialog, DialogContent, DialogFooter, DialogClose } from '../../../../components/ui/Dialog/Dialog';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { useEditorStore } from '../../store/useEditorStore';
import { usePlotActions } from '../../hooks/story/usePlotActions';
import styles from './NewSubplotDialog.module.css';

/**
 * Naming a subplot. Replaces a browser `prompt()`, which could not be styled,
 * could not be cancelled without losing what you had typed, and blocked the
 * whole page while open.
 */
export const NewSubplotDialog: React.FC = () => {
  const { isOpen, setOpenDialog } = useEditorStore(
    useShallow((state) => ({
      isOpen: state.openDialog === 'newSubplot',
      setOpenDialog: state.setOpenDialog,
    }))
  );
  const { addSubplot } = usePlotActions();
  const [name, setName] = useState('');

  const trimmedName = name.trim();

  const close = () => {
    setOpenDialog(null);
    setName('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmedName) return;
    addSubplot(trimmedName, '');
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent
        title="New subplot"
        description="A named lane of pages running alongside the main plot."
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={name}
            autoFocus
            placeholder="e.g. The Smuggler's Debt"
            onChange={(event) => setName(event.target.value)}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="primary" type="submit" disabled={!trimmedName}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
