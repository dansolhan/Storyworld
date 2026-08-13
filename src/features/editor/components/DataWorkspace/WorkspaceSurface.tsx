import React from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { ItemsWorkspace } from './ItemsWorkspace';
import { VariablesWorkspace } from './VariablesWorkspace';
import { AtmospheresWorkspace } from '../Atmospheres/AtmospheresWorkspace';
import { AudioWorkspace } from '../Audio/AudioWorkspace';
import { HealthWorkspace } from '../Health/HealthWorkspace';
import { StatusDataWorkspace } from '../StatusData/StatusDataWorkspace';

/**
 * Whichever data workspace the rail has selected, or nothing when the graph is
 * showing.
 *
 * Contextual text is still a modal over the canvas, until the design's own screen
 * for it is built at 5a.
 */
export const WorkspaceSurface: React.FC = () => {
  const { activeWorkspace } = useActiveWorkspace();

  if (activeWorkspace === 'items') return <ItemsWorkspace />;
  if (activeWorkspace === 'variables') return <VariablesWorkspace />;
  if (activeWorkspace === 'atmospheres') return <AtmospheresWorkspace />;
  if (activeWorkspace === 'audio') return <AudioWorkspace />;
  if (activeWorkspace === 'health') return <HealthWorkspace />;
  if (activeWorkspace === 'statusData') return <StatusDataWorkspace />;
  return null;
};
