import { create } from 'zustand';

interface PlayerUIState {
  isTransitioning: boolean;
  contextualPopover: { text: string; title?: string; x: number; y: number; width: number; height: number } | null;
  
  setTransitioning: (val: boolean) => void;
  setContextualPopover: (val: PlayerUIState['contextualPopover']) => void;
}

export const usePlayerUIStore = create<PlayerUIState>((set) => ({
  isTransitioning: false,
  contextualPopover: null,
  
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  setContextualPopover: (contextualPopover) => set({ contextualPopover }),
}));
