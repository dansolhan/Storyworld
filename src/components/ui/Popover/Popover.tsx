import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Popover.module.css';

export interface PopoverProps {
  isOpen: boolean;
  onClose?: () => void;
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  x,
  y,
  children,
  className = '',
  style = {},
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside the popover
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      onClose?.();
    };

    // Use a slight delay to prevent the initial click that opened the popover from immediately closing it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`${styles.popover} ${className}`}
      style={{ left: x, top: y, ...style }}
      onClick={(e) => e.stopPropagation()} // Stop propagation to avoid bubbling up to editors/document
    >
      {children}
    </div>,
    document.body
  );
};
