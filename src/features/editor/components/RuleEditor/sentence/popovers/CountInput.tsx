import React from 'react';
import styles from '../BlueprintRenderer.module.css';

interface CountInputProps {
  value: string;
  onChange: (val: string) => void;
  onSave: (val: number) => void;
}

export const CountInput: React.FC<CountInputProps> = ({ value, onChange, onSave }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>Set count:</p>
    <div className={styles.inputGroup}>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave(parseInt(value, 10) || 1);
          }
        }}
        className={styles.popoverInput}
      />
      <button onClick={() => onSave(parseInt(value, 10) || 1)} className={styles.popoverButton}>
        Save
      </button>
    </div>
  </div>
);
