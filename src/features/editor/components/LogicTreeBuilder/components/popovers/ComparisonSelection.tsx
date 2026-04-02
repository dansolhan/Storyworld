import React from 'react';
import { Combobox } from '../../../../../../components/ui/Combobox/Combobox';
import styles from '../../BlueprintRenderer.module.css';

interface ComparisonSelectionProps {
  onSelect: (val: string) => void;
}

export const ComparisonSelection: React.FC<ComparisonSelectionProps> = ({ onSelect }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>Set comparison:</p>
    <Combobox
      options={[
        { label: 'equal', value: 'equal' },
        { label: 'greater than', value: 'greater than' },
        { label: 'greater or equal', value: 'greater or equal' },
        { label: 'less or equal', value: 'less or equal' },
        { label: 'less than', value: 'less than' },
        { label: 'exactly', value: 'exactly' },
        { label: 'more than', value: 'more than' },
      ]}
      autoFocus
      onSelect={onSelect}
    />
  </div>
);
