import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import styles from './Dialog.module.css';

/**
 * Modal dialog built on Radix, styled with CSS Modules.
 *
 * Composed rather than configured — the caller assembles header, body and
 * footer — so a searchable palette and a one-field form can share a shell
 * without either growing props the other does not want. Focus trapping,
 * scroll locking, Escape and ARIA wiring come from Radix.
 */
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  /** Accessible name. Rendered visibly unless `hideTitle` is set. */
  title: string;
  hideTitle?: boolean;
  /** Accessible description, announced with the dialog. */
  description?: string;
  /** Width of the panel; the design's modals are 560px and 640px. */
  width?: number;
  showCloseButton?: boolean;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  title,
  hideTitle = false,
  description,
  width = 440,
  showCloseButton = true,
  children,
  ...contentProps
}) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className={styles.overlay} />
    <RadixDialog.Content
      className={styles.content}
      style={{ width: `min(${width}px, calc(100vw - 32px))` }}
      {...contentProps}
    >
      <div className={styles.header}>
        {hideTitle ? (
          <RadixDialog.Title className={styles.visuallyHidden}>{title}</RadixDialog.Title>
        ) : (
          <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
        )}
        {showCloseButton && (
          <RadixDialog.Close className={styles.close} aria-label="Close">
            <X className={styles.closeIcon} aria-hidden="true" />
          </RadixDialog.Close>
        )}
      </div>

      {description !== undefined && (
        <RadixDialog.Description className={styles.description}>{description}</RadixDialog.Description>
      )}

      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
);

export const DialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={styles.footer}>{children}</div>
);
