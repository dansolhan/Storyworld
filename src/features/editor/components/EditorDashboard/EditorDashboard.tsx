import React, { useCallback } from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { StorySettingsDrawer } from '../StorySettings/StorySettingsDrawer';

/**
 * The one surface that is deliberately not a workspace.
 *
 * All six modal managers are gone — Items, Variables, Audio, Atmospheres, Status
 * data and Contextual text each have their own screen behind the rail. Story
 * settings stays a drawer because it is a handful of fields rather than a surface,
 * and it does not cover the canvas.
 */
export const EditorDashboard: React.FC = React.memo(() => {
  const { activeWorkspace, setActiveWorkspace } = useActiveWorkspace();
  const returnToGraph = useCallback(() => setActiveWorkspace('graph'), [setActiveWorkspace]);

  return <StorySettingsDrawer isOpen={activeWorkspace === 'settings'} onClose={returnToGraph} />;
});
