import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const usePlotActions = () => {
  return useEditorStore(
    useShallow((state) => ({
      currentPlotId: state.currentPlotId,
      setCurrentPlotId: state.setCurrentPlotId,
      addSubplot: state.addSubplot,
    }))
  );
};
