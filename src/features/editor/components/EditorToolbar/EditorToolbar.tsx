import React from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { useEditorStore } from '../../store/useEditorStore';
import styles from './EditorToolbar.module.css';

export const EditorToolbar: React.FC = () => {
  const { addPage } = useEditorStore();

  const handleAddNewPage = () => {
    const x = Math.random() * 400;
    const y = Math.random() * 400;
    addPage(x, y);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Button variant="primary" size="sm" onClick={handleAddNewPage}>
            + Add Page Node
          </Button>
        </div>
      </div>
    </>
  );
};
