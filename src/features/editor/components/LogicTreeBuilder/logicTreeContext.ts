import { createContext } from 'react';

export interface LogicTreeContextValue {
  updateNodeParams: (nodeId: string, params: Record<string, unknown>) => void;
}

/** Lets a deeply nested tree node write params back without prop threading. */
export const LogicTreeContext = createContext<LogicTreeContextValue | null>(null);
