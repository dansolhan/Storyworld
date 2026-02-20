import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Drawer } from '../../../../components/ui/Drawer/Drawer';
import { Button } from '../../../../components/ui/Button/Button';
import styles from './VariableManager.module.css';

interface VariableManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({ isOpen, onClose }) => {
  const { variables, addVariable, updateVariable, removeVariable } = useEditorStore();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey && !variables[newKey]) {
      addVariable(newKey, newValue);
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Global Variables" width="400px">
      <div className={styles.container}>
        <p className={styles.description}>
          Define variables to be used in paragraphs. Example: <code>{'{'}{'{'}playerName{'}'}{'}'}</code>
        </p>

        <div className={styles.addForm}>
          <input
            type="text"
            className={styles.input}
            placeholder="Name (e.g. playerName)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            type="text"
            className={styles.input}
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <Button onClick={handleAdd} size="sm" disabled={!newKey}>Add</Button>
        </div>

        <div className={styles.list}>
          {Object.entries(variables).map(([key, value]) => (
            <div key={key} className={styles.variableRow}>
              <div className={styles.keyDisplay}>{key}</div>
              <input
                type="text"
                className={styles.input}
                value={value}
                onChange={(e) => updateVariable(key, e.target.value)}
                placeholder="Value"
              />
              <Button variant="danger" size="sm" onClick={() => removeVariable(key)}>Del</Button>
            </div>
          ))}
          {Object.keys(variables).length === 0 && (
            <p className={styles.empty}>No variables defined yet.</p>
          )}
        </div>
      </div>
    </Drawer>
  );
};
