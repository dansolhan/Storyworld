import React from 'react';
import { Combobox } from '../../../../../../components/ui/Combobox/Combobox';
import styles from '../../BlueprintRenderer.module.css';

interface SubplotSelectionProps {
  options: { label: string; value: string }[];
  onSelect: (val: string) => void;
}

export const SubplotSelection: React.FC<SubplotSelectionProps> = ({ options, onSelect }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>Select a subplot:</p>
    <Combobox
      options={options}
      autoFocus
      onSelect={onSelect}
    />
  </div>
);
