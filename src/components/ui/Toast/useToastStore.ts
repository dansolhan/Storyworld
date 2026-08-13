import { create } from 'zustand';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  /** Changes on every show, so Radix remounts and restarts the timer. */
  id: string;
  message: string;
  action?: ToastAction;
}

export interface ToastState {
  toast: ToastMessage | null;
  showToast: (message: string, action?: ToastAction) => void;
  dismissToast: () => void;
}

/**
 * The one transient message the editor is showing.
 *
 * Deliberately holds a single toast rather than a queue: these report what just
 * happened and offer to undo it, and two of those stacked up would leave the
 * author guessing which Undo belongs to which action.
 */
export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (message, action) => set({ toast: { id: crypto.randomUUID(), message, action } }),
  dismissToast: () => set({ toast: null }),
}));
