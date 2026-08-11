import React from 'react';
import { Combobox } from '../../../../../../components/ui/Combobox/Combobox';
import styles from '../BlueprintRenderer.module.css';

interface DisplayStyleSelectionProps {
  onSelect: (val: string) => void;
}

export const DisplayStyleSelection: React.FC<DisplayStyleSelectionProps> = ({ onSelect }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>Message format:</p>
    <Combobox
      options={[
        { label: 'Styled Notification', value: 'styled' },
        { label: 'Regular Paragraph', value: 'paragraph' }
      ]}
      autoFocus
      onSelect={onSelect}
    />
  </div>
);
