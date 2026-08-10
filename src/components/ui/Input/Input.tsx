import React, { startTransition, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  onChange,
  ...props
}) => {
  // `useId` rather than a random string: the id has to survive re-renders, and
  // generating one during render is impure.
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const errorId = `${inputId}-error`;

  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    error ? styles.errorInput : '',
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      startTransition(() => {
        onChange(e);
      });
    }
  };

  return (
    <div className={containerClasses}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <input
        id={inputId}
        className={inputClasses}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && <span id={errorId} className={styles.errorText}>{error}</span>}
    </div>
  );
};
