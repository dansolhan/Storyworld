import React, { useCallback } from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { StorySettingsDrawer } from '../StorySettings/StorySettingsDrawer';
import { StatusDataManager } from '../StatusDataManager/StatusDataManager';
import { ContextManager } from '../ContextManager/ContextManager';

/**
 * The data surfaces still living as modals over the canvas.
 *
 * Items, Variables, Atmospheres and Audio have their own workspaces now. Status
 * data and Contextual text keep their modals until 5d and 5a, at which point
 * this component and `ExpandableBottomPanel` go with them.
 */
export const EditorDashboard: React.FC = React.memo(() => {
  const { activeWorkspace, setActiveWorkspace } = useActiveWorkspace();

  const returnToGraph = useCallback(() => setActiveWorkspace('graph'), [setActiveWorkspace]);

  return (
    <>
      <StorySettingsDrawer isOpen={activeWorkspace === 'settings'} onClose={returnToGraph} />
      <StatusDataManager isOpen={activeWorkspace === 'statusData'} onClose={returnToGraph} />
      <ContextManager isOpen={activeWorkspace === 'context'} onClose={returnToGraph} />
    </>
  );
});
