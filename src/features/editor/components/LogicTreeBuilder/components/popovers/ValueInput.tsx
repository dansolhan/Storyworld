import React from 'react';
import styles from '../../BlueprintRenderer.module.css';

interface ValueInputProps {
  value: string;
  onChange: (val: string) => void;
  onSave: (val: string) => void;
}

export const ValueInput: React.FC<ValueInputProps> = ({ value, onChange, onSave }) => (
  <div className={styles.popoverContent}>
    <p className={styles.popoverTitle}>Set value:</p>
    <div className={styles.inputGroup}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave(value);
          }
        }}
        className={styles.popoverInput}
      />
      <button onClick={() => onSave(value)} className={styles.popoverButton}>
        Save
      </button>
    </div>
  </div>
);
