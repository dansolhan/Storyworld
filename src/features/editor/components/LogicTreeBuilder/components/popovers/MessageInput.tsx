import React from 'react';
import styles from '../../BlueprintRenderer.module.css';

interface MessageInputProps {
  value: string;
  onChange: (val: string) => void;
  onSave: (val: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSave }) => (
  <div className={styles.popoverContent} style={{ minWidth: 240 }}>
    <p className={styles.popoverTitle}>Post message text:</p>
    <div className={styles.inputGroup}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        placeholder="Message to inject next page..."
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
