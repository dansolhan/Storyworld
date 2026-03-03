import React, { useState } from 'react';
import { Combobox as HeadlessCombobox, ComboboxInput, ComboboxOptions, ComboboxOption, ComboboxButton } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import styles from './Combobox.module.css';

export interface ComboboxOptionType {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOptionType[];
  onSelect: (value: string) => void;
  value?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  onSelect,
  value,
  placeholder = 'Search...',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');

  // Find the currently selected option object
  const selectedOption = value ? options.find(o => o.value === value) || null : null;

  const filteredOptions = query === ''
    ? options
    : options.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase()) ||
      option.value.toLowerCase().includes(query.toLowerCase())
    );

  const handleChange = (selected: ComboboxOptionType | null) => {
    if (selected) {
      onSelect(selected.value);
    }
  };

  return (
    <div className={styles.container}>
      <HeadlessCombobox value={selectedOption} onChange={handleChange}>
        <div className={styles.inputWrapper}>
          <ComboboxInput
            className={styles.input}
            displayValue={(option: ComboboxOptionType | null) => option?.label ?? ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
          <ComboboxButton className={styles.button}>
            <ChevronDown size={16} />
          </ComboboxButton>
        </div>
        <ComboboxOptions className={styles.listbox}>
          {filteredOptions.length === 0 ? (
            <div className={styles.empty}>No results found</div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option}
                className={({ focus, selected }) =>
                  `${styles.option} ${focus ? styles.active : ''} ${selected ? styles.selected : ''}`
                }
              >
                {({ selected }) => (
                  <>
                    <span className={`${styles.optionLabel} ${selected ? styles.selectedText : ''}`}>
                      {option.label}
                    </span>
                    <span className={styles.optionValue}>{option.value}</span>
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </HeadlessCombobox>
    </div>
  );
};
