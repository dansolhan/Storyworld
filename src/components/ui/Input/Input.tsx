import React, { startTransition } from 'react';
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
  const generatedId = id || Math.random().toString(36).substring(7);

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
      {label && <label htmlFor={generatedId} className={styles.label}>{label}</label>}
      <input
        id={generatedId}
        className={inputClasses}
        onChange={handleChange}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
