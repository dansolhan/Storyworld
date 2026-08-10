import React, { useEffect, useMemo } from 'react';
import { StoryEngine } from '../../../lib/engine/StoryEngine';
import { audioManager } from '../../../lib/audioManager';
import { EngineContext } from './engineContext';

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
