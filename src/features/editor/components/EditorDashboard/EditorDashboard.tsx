import React, { useCallback } from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { StorySettingsDrawer } from '../StorySettings/StorySettingsDrawer';
import { StatusDataManager } from '../StatusDataManager/StatusDataManager';
import { AtmosphereManager } from '../AtmosphereManager/AtmosphereManager';
import { ContextManager } from '../ContextManager/ContextManager';
import { AudioManagerModal } from '../Audio/AudioManagerModal';

/**
 * The data surfaces still living as modals over the canvas.
 *
 * Items and Variables have moved into the Data workspace. These four keep their
 * modals until the design's own screens exist for them — Atmospheres and Audio
 * at 4c, Status data at 5d, Contextual text at 5a — at which point this
 * component and `ExpandableBottomPanel` go with them.
 */
export const EditorDashboard: React.FC = React.memo(() => {
  const { activeWorkspace, setActiveWorkspace } = useActiveWorkspace();

  const returnToGraph = useCallback(() => setActiveWorkspace('graph'), [setActiveWorkspace]);

  return (
    <>
      <StorySettingsDrawer isOpen={activeWorkspace === 'settings'} onClose={returnToGraph} />
      <StatusDataManager isOpen={activeWorkspace === 'statusData'} onClose={returnToGraph} />
      <AtmosphereManager isOpen={activeWorkspace === 'atmospheres'} onClose={returnToGraph} />
      <ContextManager isOpen={activeWorkspace === 'context'} onClose={returnToGraph} />
      <AudioManagerModal />
    </>
  );
});
