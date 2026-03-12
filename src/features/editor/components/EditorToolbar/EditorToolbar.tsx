import React, { useMemo, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '../../../../components/ui/Button/Button';
import { Combobox } from '../../../../components/ui/Combobox/Combobox';
import { useEditorStore } from '../../store/useEditorStore';
import styles from './EditorToolbar.module.css';

export const EditorToolbar: React.FC = memo(() => {
  const { 
    addPage, 
    subplots, 
    currentPlotId, 
    setCurrentPlotId, 
    addSubplot, 
    pageColorMode, 
    setPageColorMode 
  } = useEditorStore(useShallow(state => ({
    addPage: state.addPage,
    subplots: state.subplots,
    currentPlotId: state.currentPlotId,
    setCurrentPlotId: state.setCurrentPlotId,
    addSubplot: state.addSubplot,
    pageColorMode: state.pageColorMode,
    setPageColorMode: state.setPageColorMode
  })));

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

  const colorModeOptions = useMemo(() => [
    { label: 'Color on Type', value: 'type' },
    { label: 'Color on Atmosphere', value: 'atmosphere' },
  ], []);

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
          <Combobox
            options={colorModeOptions}
            value={pageColorMode}
            placeholder="Color Mode"
            onSelect={(val) => setPageColorMode(val as 'type' | 'atmosphere')}
          />
          <div style={{ width: '12px' }} /> {/* Spacer */}
          <Button variant="primary" size="sm" onClick={handleAddNewPage}>
            + Add Page Node
          </Button>
        </div>
      </div>
    </>
  );
});
