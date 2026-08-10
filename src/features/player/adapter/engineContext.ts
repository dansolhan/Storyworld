import { createContext } from 'react';
import type { StoryEngine } from '../../../lib/engine/StoryEngine';

/**
 * Holds the single StoryEngine instance for a play session.
 *
 * Kept apart from the provider component so this file exports no components —
 * a module mixing the two breaks fast refresh for everything importing it.
 */
export const EngineContext = createContext<StoryEngine | null>(null);
