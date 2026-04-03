import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useStore } from 'zustand';
import { StoryEngine } from '../../../lib/engine/StoryEngine';
import type { EngineState } from '../../../lib/engine/types';
import { audioManager } from '../../../lib/audioManager';

const EngineContext = createContext<StoryEngine | null>(null);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = useMemo(() => new StoryEngine(), []);

  // Cleanup: Stop all sounds when the engine is destroyed (e.g. navigation away)
  useEffect(() => {
    return () => {
      audioManager.stopAll();
    };
  }, []);

  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
};

export const useEngine = () => {
  const context = useContext(EngineContext);
  if (!context) throw new Error('useEngine must be used within EngineProvider');
  return context;
};

export function useEngineStore<T>(selector: (state: EngineState) => T): T {
  const engine = useEngine();
  return useStore(engine.store, selector);
}
