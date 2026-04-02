import React, { createContext, useContext, useMemo } from 'react';
import { useStore } from 'zustand';
import { StoryEngine } from '../../../lib/engine/StoryEngine';
import type { EngineState } from '../../../lib/engine/types';

const EngineContext = createContext<StoryEngine | null>(null);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = useMemo(() => new StoryEngine(), []);
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
