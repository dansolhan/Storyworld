import React from 'react';
import { Combobox } from '../../../../../../components/ui/Combobox/Combobox';
import styles from '../../BlueprintRenderer.module.css';

interface ItemSelectionProps {
  options: { label: string; value: string }[];
  onSelect: (val: string) => void;
}

export const ItemSelection: React.FC<ItemSelectionProps> = ({ options, onSelect }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>Select an item:</p>
    {options.length > 0 ? (
      <Combobox
        options={options}
        autoFocus
        onSelect={onSelect}
      />
    ) : (
      <p className={styles.popoverEmpty}>No items defined yet.</p>
    )}
  </div>
);
