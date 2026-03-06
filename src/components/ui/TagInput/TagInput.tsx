import React, { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import styles from './TagInput.module.css';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder, className, style }) => {
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag if backspace is pressed and input is empty
      const newTags = [...tags];
      newTags.pop();
      onChange(newTags);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div
      className={`${styles.container} ${className || ''}`}
      style={style}
      onClick={() => {
        const input = containerRef.current?.querySelector('input');
        if (input) input.focus();
      }}
      ref={containerRef}
    >
      {tags.map((tag, index) => (
        <span key={index} className={styles.chip}>
          {tag}
          <button
            type="button"
            className={styles.removeBtn}
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            aria-label={`Remove ${tag} tag`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        className={styles.input}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : ''}
      />
    </div>
  );
};
