import React, { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import styles from './Combobox.module.css';

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  onSelect,
  placeholder = 'Search...',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const filteredOptions = query === ''
    ? options
    : options.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase()) ||
      option.value.toLowerCase().includes(query.toLowerCase())
    );

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Reset selection when options change
    setSelectedIndex(0);
  }, [filteredOptions.length]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (filteredOptions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Enter':
        e.preventDefault();
        onSelect(filteredOptions[selectedIndex].value);
        break;
      case 'Escape':
        // The parent might handle escape to close the popover
        break;
    }
  };

  useEffect(() => {
    // Scroll the selected item into view safely
    if (listboxRef.current) {
      const activeItem = listboxRef.current.children[selectedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={styles.container}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <ul ref={listboxRef} className={styles.listbox} role="listbox">
        {filteredOptions.length === 0 ? (
          <li className={styles.empty}>No results found</li>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(option.value)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionValue}>{option.value}</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
