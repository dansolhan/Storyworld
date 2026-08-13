import React from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { useShallow } from 'zustand/react/shallow';
import { useToastStore } from './useToastStore';
import styles from './Toaster.module.css';

/** Long enough to read the sentence and reach for Undo. */
const DURATION_MS = 8000;

/**
 * Renders whatever `useToastStore` is holding.
 *
 * Mounted once at the shell. Radix owns the timer, the swipe-to-dismiss and
 * returning focus where it came from; the store owns what is being said.
 */
export const Toaster: React.FC = () => {
  const { toast, dismissToast } = useToastStore(
    useShallow((state) => ({ toast: state.toast, dismissToast: state.dismissToast }))
  );

  return (
    <RadixToast.Provider duration={DURATION_MS} swipeDirection="right">
      {toast && (
        <RadixToast.Root
          // Keyed on the message id so a second toast restarts the timer rather
          // than inheriting the remaining time of the one it replaced.
          key={toast.id}
          className={styles.toast}
          open
          onOpenChange={(open) => (open ? undefined : dismissToast())}
        >
          <RadixToast.Description className={styles.message}>{toast.message}</RadixToast.Description>

          {toast.action && (
            <RadixToast.Action
              className={styles.action}
              altText={toast.action.label}
              onClick={() => {
                toast.action?.onClick();
                dismissToast();
              }}
            >
              {toast.action.label}
            </RadixToast.Action>
          )}

          <RadixToast.Close className={styles.close} aria-label="Dismiss">
            ×
          </RadixToast.Close>
        </RadixToast.Root>
      )}

      <RadixToast.Viewport className={styles.viewport} />
    </RadixToast.Provider>
  );
};
