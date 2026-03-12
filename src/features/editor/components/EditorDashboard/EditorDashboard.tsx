import React, { useCallback } from 'react';
import { useManagerStates } from '../../hooks/view/useManagerStates';
import { StorySettingsDrawer } from '../StorySettings/StorySettingsDrawer';
import { ItemManager } from '../ItemManager/ItemManager';
import { StatusDataManager } from '../StatusDataManager/StatusDataManager';
import { VariableManager } from '../VariableManager/VariableManager';
import { AtmosphereManager } from '../AtmosphereManager/AtmosphereManager';
import { AudioManagerModal } from '../Audio/AudioManagerModal';

export const EditorDashboard: React.FC = React.memo(() => {
  const {
    isStorySettingsOpen,
    setIsStorySettingsOpen,
    isVariableManagerOpen,
    setIsVariableManagerOpen,
    isAtmosphereManagerOpen,
    setIsAtmosphereManagerOpen,
    isItemManagerOpen,
    setIsItemManagerOpen,
    isStatusDataManagerOpen,
    setIsStatusDataManagerOpen,
  } = useManagerStates();

  const closeStorySettings = useCallback(() => setIsStorySettingsOpen(false), [setIsStorySettingsOpen]);
  const closeItemManager = useCallback(() => setIsItemManagerOpen(false), [setIsItemManagerOpen]);
  const closeStatusDataManager = useCallback(() => setIsStatusDataManagerOpen(false), [setIsStatusDataManagerOpen]);
  const closeVariableManager = useCallback(() => setIsVariableManagerOpen(false), [setIsVariableManagerOpen]);
  const closeAtmosphereManager = useCallback(() => setIsAtmosphereManagerOpen(false), [setIsAtmosphereManagerOpen]);

  return (
    <>
      <StorySettingsDrawer isOpen={isStorySettingsOpen} onClose={closeStorySettings} />
      <ItemManager isOpen={isItemManagerOpen} onClose={closeItemManager} />
      <StatusDataManager isOpen={isStatusDataManagerOpen} onClose={closeStatusDataManager} />
      <VariableManager isOpen={isVariableManagerOpen} onClose={closeVariableManager} />
      <AtmosphereManager isOpen={isAtmosphereManagerOpen} onClose={closeAtmosphereManager} />
      <AudioManagerModal />
    </>
  );
});
