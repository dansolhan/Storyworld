import React, { useMemo } from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { Combobox } from '../../../../components/ui/Combobox/Combobox';
import { useEditorStore } from '../../store/useEditorStore';
import styles from './EditorToolbar.module.css';

export const EditorToolbar: React.FC = () => {
  const { addPage, subplots, currentPlotId, setCurrentPlotId, addSubplot } = useEditorStore();

  const handleAddNewPage = () => {
    const x = Math.random() * 400;
    const y = Math.random() * 400;
    addPage(x, y);
  };

  const handleAddSubplot = () => {
    const name = prompt('Subplot Name:');
    if (name) {
      addSubplot(name, '');
    }
  };

  const plotOptions = useMemo(() => {
    return [
      { label: 'Main Plot', value: 'MAIN' },
      ...subplots.map(s => ({ label: s.name, value: s.id }))
    ];
  }, [subplots]);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Combobox
            options={plotOptions}
            value={currentPlotId || 'MAIN'}
            placeholder="Select Plot..."
            onSelect={(val) => setCurrentPlotId(val === 'MAIN' ? null : val)}
          />
          <span style={{ color: 'var(--color-text-secondary)', marginLeft: '12px' }}>{currentPlotId ? 'Subplot' : 'Main Plot'}</span>
          <Button variant="secondary" size="sm" onClick={handleAddSubplot} style={{ marginLeft: '12px' }}>
            + Add Subplot
          </Button>
          <div style={{ width: '24px' }} /> {/* Spacer */}
          <Button variant="primary" size="sm" onClick={handleAddNewPage}>
            + Add Page Node
          </Button>
        </div>
      </div>
    </>
  );
};
