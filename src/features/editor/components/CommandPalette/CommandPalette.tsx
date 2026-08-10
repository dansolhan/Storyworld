import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Dialog, DialogContent } from '../../../../components/ui/Dialog/Dialog';
import { useEditorStore } from '../../store/useEditorStore';
import { PaletteContent } from './PaletteContent';
import type { MenuConfig } from '../../../../config/menuConfig';
import styles from './CommandPalette.module.css';

export interface CommandPaletteProps {
  /** File / Story groups, so their commands are reachable by typing. */
  menus: MenuConfig[];
}

/** Panel width from the design. */
const PALETTE_WIDTH = 560;

export const CommandPalette: React.FC<CommandPaletteProps> = ({ menus }) => {
  const { isOpen, setOpenDialog } = useEditorStore(
    useShallow((state) => ({
      isOpen: state.openDialog === 'palette',
      setOpenDialog: state.setOpenDialog,
    }))
  );

  const close = () => setOpenDialog(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent
        title="Search this story"
        hideTitle
        showCloseButton={false}
        padded={false}
        width={PALETTE_WIDTH}
        className={styles.panel}
      >
        <PaletteContent menus={menus} onClose={close} />
      </DialogContent>
    </Dialog>
  );
};
