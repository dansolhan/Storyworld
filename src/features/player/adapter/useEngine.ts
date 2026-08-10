import { useContext } from 'react';
import { EngineContext } from './engineContext';
import type { StoryEngine } from '../../../lib/engine/StoryEngine';

export const useEngine = (): StoryEngine => {
  const context = useContext(EngineContext);
  if (!context) throw new Error('useEngine must be used within EngineProvider');
  return context;
};
