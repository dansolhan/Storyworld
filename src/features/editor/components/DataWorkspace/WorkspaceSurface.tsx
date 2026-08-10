import React from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { ItemsWorkspace } from './ItemsWorkspace';
import { VariablesWorkspace } from './VariablesWorkspace';

/**
 * Whichever data workspace the rail has selected, or nothing when the graph is
 * showing.
 *
 * Only Items and Variables live here so far. The rest are still modals over the
 * canvas until the design's own screens for them are built — Atmospheres and
 * Audio at 4c, Status data at 5d, Contextual text at 5a.
 */
export const WorkspaceSurface: React.FC = () => {
  const { activeWorkspace } = useActiveWorkspace();

  if (activeWorkspace === 'items') return <ItemsWorkspace />;
  if (activeWorkspace === 'variables') return <VariablesWorkspace />;
  return null;
};
