import React, { startTransition, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
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
  const textareaId = id ?? fallbackId;
  const errorId = `${textareaId}-error`;

  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  const textareaClasses = [
    styles.textarea,
    error ? styles.errorTextarea : '',
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      startTransition(() => {
        onChange(e);
      });
    }
  };

  return (
    <div className={containerClasses}>
      {label && <label htmlFor={textareaId} className={styles.label}>{label}</label>}
      <textarea
        id={textareaId}
        className={textareaClasses}
        rows={props.rows || 4}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && <span id={errorId} className={styles.errorText}>{error}</span>}
    </div>
  );
};
