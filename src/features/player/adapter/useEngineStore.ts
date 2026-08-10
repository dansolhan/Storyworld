import { useStore } from 'zustand';
import { useEngine } from './useEngine';
import type { EngineState } from '../../../lib/engine/types';

/** Subscribes to the smallest slice of engine state a component needs. */
export function useEngineStore<T>(selector: (state: EngineState) => T): T {
  const engine = useEngine();
  return useStore(engine.store, selector);
}
