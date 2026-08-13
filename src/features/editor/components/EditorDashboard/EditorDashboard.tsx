import React, { useCallback } from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { StorySettingsDrawer } from '../StorySettings/StorySettingsDrawer';
import { ContextManager } from '../ContextManager/ContextManager';

/**
 * The data surfaces still living as modals over the canvas.
 *
 * Only Contextual text is left; everything else has its own workspace. Story
 * settings is a drawer by choice — it is a handful of fields, not a surface. When
 * `5a` lands, this component and `ExpandableBottomPanel` go with it.
 */
export const EditorDashboard: React.FC = React.memo(() => {
  const { activeWorkspace, setActiveWorkspace } = useActiveWorkspace();

  const returnToGraph = useCallback(() => setActiveWorkspace('graph'), [setActiveWorkspace]);

  return (
    <>
      <StorySettingsDrawer isOpen={activeWorkspace === 'settings'} onClose={returnToGraph} />
      <ContextManager isOpen={activeWorkspace === 'context'} onClose={returnToGraph} />
    </>
  );
});
