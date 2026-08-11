import React from 'react';
import { Combobox } from '../../../../../../components/ui/Combobox/Combobox';
import styles from '../BlueprintRenderer.module.css';

interface VariableSelectionProps {
  options: { label: string; value: string }[];
  onSelect: (val: string) => void;
}

export const VariableSelection: React.FC<VariableSelectionProps> = ({ options, onSelect }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>Select a variable:</p>
    {options.length > 0 ? (
      <Combobox
        options={options}
        autoFocus
        onSelect={onSelect}
      />
    ) : (
      <p className={styles.popoverEmpty}>No variables defined yet.</p>
    )}
  </div>
);
