import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useManagerStates = () => {
  return useEditorStore(
    useShallow((state) => ({
      isStorySettingsOpen: state.isStorySettingsOpen,
      setIsStorySettingsOpen: state.setIsStorySettingsOpen,
      isVariableManagerOpen: state.isVariableManagerOpen,
      setIsVariableManagerOpen: state.setIsVariableManagerOpen,
      isAtmosphereManagerOpen: state.isAtmosphereManagerOpen,
      setIsAtmosphereManagerOpen: state.setIsAtmosphereManagerOpen,
      isItemManagerOpen: state.isItemManagerOpen,
      setIsItemManagerOpen: state.setIsItemManagerOpen,
      isStatusDataManagerOpen: state.isStatusDataManagerOpen,
      setIsStatusDataManagerOpen: state.setIsStatusDataManagerOpen,
      isContextManagerOpen: state.isContextManagerOpen,
      setIsContextManagerOpen: state.setIsContextManagerOpen,
    }))
  );
};
