import React, { useCallback } from 'react';
import { useActiveWorkspace } from '../../hooks/view/useActiveWorkspace';
import { StorySettingsDrawer } from '../StorySettings/StorySettingsDrawer';
import { ItemManager } from '../ItemManager/ItemManager';
import { StatusDataManager } from '../StatusDataManager/StatusDataManager';
import { VariableManager } from '../VariableManager/VariableManager';
import { AtmosphereManager } from '../AtmosphereManager/AtmosphereManager';
import { ContextManager } from '../ContextManager/ContextManager';
import { AudioManagerModal } from '../Audio/AudioManagerModal';

/**
 * Host for the data surfaces the left rail navigates to.
 *
 * These are still the pre-redesign modal managers — they are folded into a
 * single Data workspace in a later step. Until then this component's job is
 * just to render whichever one `activeWorkspace` names, and to send the editor
 * back to the graph when it is dismissed.
 */
export const EditorDashboard: React.FC = React.memo(() => {
  const { activeWorkspace, setActiveWorkspace } = useActiveWorkspace();

  const returnToGraph = useCallback(() => setActiveWorkspace('graph'), [setActiveWorkspace]);

  return (
    <>
      <StorySettingsDrawer isOpen={activeWorkspace === 'settings'} onClose={returnToGraph} />
      <ItemManager isOpen={activeWorkspace === 'items'} onClose={returnToGraph} />
      <StatusDataManager isOpen={activeWorkspace === 'statusData'} onClose={returnToGraph} />
      <VariableManager isOpen={activeWorkspace === 'variables'} onClose={returnToGraph} />
      <AtmosphereManager isOpen={activeWorkspace === 'atmospheres'} onClose={returnToGraph} />
      <ContextManager isOpen={activeWorkspace === 'context'} onClose={returnToGraph} />
      <AudioManagerModal />
    </>
  );
});
