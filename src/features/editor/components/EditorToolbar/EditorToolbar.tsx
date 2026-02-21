import React from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { useEditorStore } from '../../store/useEditorStore';
import { compileGraphToStory } from '../../../../lib/storyMapper';
import { exportToJson, exportToStoryworld } from '../../../../utils/exportUtils';
import { useStoryImport } from '../../hooks/useStoryImport';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  onOpenVariableManager: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onOpenVariableManager }) => {
  const { nodes, edges, variables, addPage } = useEditorStore();
  const { fileInputRef, handleImportClick, handleFileChange } = useStoryImport();

  const handleAddNewPage = () => {
    const x = Math.random() * 400;
    const y = Math.random() * 400;
    addPage(x, y);
  };

  const handleExportJson = () => {
    const storyData = compileGraphToStory(nodes, edges, variables);
    exportToJson(storyData);
  };

  const handleExportStoryworld = () => {
    const storyData = compileGraphToStory(nodes, edges, variables);
    exportToStoryworld(storyData);
  };

  return (
    <>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Button variant="primary" size="sm" onClick={handleAddNewPage}>
            + Add Page Node
          </Button>
          <Button variant="secondary" size="sm" onClick={onOpenVariableManager}>
            Variables
          </Button>
        </div>
        <div className={styles.toolbarGroup}>
          <Button variant="secondary" size="sm" onClick={handleImportClick}>
            Import JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportJson}>
            Export to JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportStoryworld}>
            Export to .storyworld
          </Button>
        </div>
      </div>
    </>
  );
};
