import React, { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  useTransitionStyles,
} from '@floating-ui/react';
import styles from './Popover.module.css';

export interface PopoverProps {
  isOpen: boolean;
  onClose?: () => void;
  x: number;
  y: number;
  width?: number;
  height?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  offset?: number;
  arrowRef?: React.RefObject<HTMLElement | null>;
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  x,
  y,
  width = 0,
  height = 0,
  children,
  className = '',
  style = {},
  offset: offsetValue = 8,
  arrowRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Create a virtual element for Floating UI based on the provided x, y coordinates and dimensions
  const virtualElement = useMemo(() => ({
    getBoundingClientRect() {
      return {
        width,
        height,
        x,
        y,
        top: y,
        left: x,
        right: x + width,
        bottom: y + height,
      };
    },
  }), [x, y, width, height]);

  const { refs, floatingStyles, placement, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose?.();
    },
    middleware: [
      offset(offsetValue),
      flip({ padding: 10 }),
      shift({ padding: 10 }),
      ...(arrowRef ? [arrow({ element: arrowRef })] : []),
    ],
    whileElementsMounted: autoUpdate,
    placement: 'bottom',
    strategy: 'fixed',
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 200,
    initial: () => ({
      opacity: 0,
    }),
    open: {
      opacity: 1,
    },
    close: () => ({
      opacity: 0,
    }),
  });

  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    refs.setFloating(node);
    if (popoverRef) {
      (popoverRef as any).current = node;
    }
  };

  useEffect(() => {
    if (isOpen) {
      refs.setPositionReference(virtualElement);
    }
  }, [isOpen, virtualElement, refs]);

  const lastChildren = useRef<React.ReactNode>(null);
  if (isOpen) {
    lastChildren.current = children;
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      onClose?.();
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  // We can pass the placement back via data attribute if needed for CSS
  const currentPlacement = placement.split('-')[0];

  return createPortal(
    <div
      ref={setRefs}
      className={`${styles.popover} ${className}`}
      style={{
        ...floatingStyles,
        ...transitionStyles,
        ...style,
        ...(context.middlewareData.arrow?.x != null ? { '--arrow-x': `${context.middlewareData.arrow.x}px` } : {}),
        ...(context.middlewareData.arrow?.y != null ? { '--arrow-y': `${context.middlewareData.arrow.y}px` } : {}),
      } as React.CSSProperties}
      data-placement={currentPlacement}
      data-popover="true"
      onClick={(e) => e.stopPropagation()}
    >
      {isOpen ? children : lastChildren.current}
    </div>,
    document.body
  );
};
