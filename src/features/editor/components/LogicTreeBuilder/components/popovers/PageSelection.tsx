import React from 'react';
import { Combobox } from '../../../../../../components/ui/Combobox/Combobox';
import styles from '../../BlueprintRenderer.module.css';

interface PageSelectionProps {
  title: string;
  options: { label: string; value: string }[];
  onSelect: (val: string) => void;
}

export const PageSelection: React.FC<PageSelectionProps> = ({ title, options, onSelect }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>{title}</p>
    <Combobox
      options={options}
      autoFocus
      onSelect={onSelect}
    />
  </div>
);
