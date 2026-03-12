import React, { startTransition } from 'react';
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
  const generatedId = id || Math.random().toString(36).substring(7);

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
      {label && <label htmlFor={generatedId} className={styles.label}>{label}</label>}
      <textarea
        id={generatedId}
        className={textareaClasses}
        rows={props.rows || 4}
        onChange={handleChange}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
