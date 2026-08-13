import React from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { ItemsWorkspace } from './ItemsWorkspace';
import { VariablesWorkspace } from './VariablesWorkspace';
import { AtmospheresWorkspace } from '../Atmospheres/AtmospheresWorkspace';
import { AudioWorkspace } from '../Audio/AudioWorkspace';
import { HealthWorkspace } from '../Health/HealthWorkspace';
import { StatusDataWorkspace } from '../StatusData/StatusDataWorkspace';
import { ContextualTextWorkspace } from '../ContextualText/ContextualTextWorkspace';

/**
 * Whichever data workspace the rail has selected, or nothing when the graph is
 * showing.
 *
 * Every data surface has its own screen now; the six modal managers are gone.
 */
export const WorkspaceSurface: React.FC = () => {
  const { activeWorkspace } = useActiveWorkspace();

  if (activeWorkspace === 'items') return <ItemsWorkspace />;
  if (activeWorkspace === 'variables') return <VariablesWorkspace />;
  if (activeWorkspace === 'atmospheres') return <AtmospheresWorkspace />;
  if (activeWorkspace === 'audio') return <AudioWorkspace />;
  if (activeWorkspace === 'health') return <HealthWorkspace />;
  if (activeWorkspace === 'statusData') return <StatusDataWorkspace />;
  if (activeWorkspace === 'context') return <ContextualTextWorkspace />;
  return null;
};
