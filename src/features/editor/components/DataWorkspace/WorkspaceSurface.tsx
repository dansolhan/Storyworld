import React from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { ItemsWorkspace } from './ItemsWorkspace';
import { VariablesWorkspace } from './VariablesWorkspace';
import { AtmospheresWorkspace } from '../Atmospheres/AtmospheresWorkspace';
import { AudioWorkspace } from '../Audio/AudioWorkspace';
import { HealthWorkspace } from '../Health/HealthWorkspace';

/**
 * Whichever data workspace the rail has selected, or nothing when the graph is
 * showing.
 *
 * Status data and Contextual text are still modals over the canvas, until the
 * design's own screens for them are built at 5d and 5a.
 */
export const WorkspaceSurface: React.FC = () => {
  const { activeWorkspace } = useActiveWorkspace();

  if (activeWorkspace === 'items') return <ItemsWorkspace />;
  if (activeWorkspace === 'variables') return <VariablesWorkspace />;
  if (activeWorkspace === 'atmospheres') return <AtmospheresWorkspace />;
  if (activeWorkspace === 'audio') return <AudioWorkspace />;
  if (activeWorkspace === 'health') return <HealthWorkspace />;
  return null;
};
