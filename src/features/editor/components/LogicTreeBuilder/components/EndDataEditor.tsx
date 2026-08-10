import React from 'react';
import { Combobox } from '../../../../../components/ui/Combobox/Combobox';
import styles from '../BlueprintRenderer.module.css';

import type { EndStoryField } from './endStoryField';

interface EndDataEditorProps {
  data: EndStoryField[];
  variableOptions: { label: string; value: string }[];
  onChange: (newData: EndStoryField[]) => void;
}

export const EndDataEditor: React.FC<EndDataEditorProps> = ({
  data,
  variableOptions,
  onChange,
}) => {
  const handleAdd = () => {
    const newData = [...(data || [])];
    newData.push({ key: '', value: '', isVariable: false });
    onChange(newData);
  };

  const handleDelete = (idx: number) => {
    const newData = [...data];
    newData.splice(idx, 1);
    onChange(newData);
  };

  const handleUpdate = (idx: number, updates: Partial<EndStoryField>) => {
    const newData = [...data];
    newData[idx] = { ...newData[idx], ...updates };
    onChange(newData);
  };

  return (
    <div className={styles.popoverContent} style={{ minWidth: 320 }}>
      <p className={styles.popoverTitle}>Configure End Data:</p>
      <div className={styles.dataList}>
        {(data || []).map((entry, idx) => (
          <div key={idx} className={styles.dataRow}>
            <input
              type="text"
              className={styles.dataInputSmall}
              placeholder="Key"
              value={entry.key}
              onChange={(e) => handleUpdate(idx, { key: e.target.value })}
            />
            
            {entry.isVariable ? (
              <div className={styles.dataCombobox}>
                <Combobox
                  options={variableOptions}
                  value={entry.value}
                  onSelect={(val) => handleUpdate(idx, { value: val })}
                />
              </div>
            ) : (
              <input
                type="text"
                className={styles.dataInputSmall}
                placeholder="Value"
                value={entry.value}
                onChange={(e) => handleUpdate(idx, { value: e.target.value })}
              />
            )}

            <button 
              className={`${styles.iconButton} ${entry.isVariable ? styles.active : ''}`}
              title={entry.isVariable ? "Switch to Constant" : "Switch to Variable"}
              onClick={() => handleUpdate(idx, { isVariable: !entry.isVariable, value: '' })}
            >
              {entry.isVariable ? 'V' : 'C'}
            </button>

            <button 
              className={styles.iconButtonDelete}
              onClick={() => handleDelete(idx)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button className={styles.addButton} onClick={handleAdd}>
        + Add Field
      </button>
    </div>
  );
};
