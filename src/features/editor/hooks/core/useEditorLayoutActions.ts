import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useEditorLayoutActions = () => {
  return useEditorStore(
    useShallow((state) => ({
      addPage: state.addPage,
      setSelectedPage: state.setSelectedPage,
      setCurrentPlotId: state.setCurrentPlotId,
      loadStory: state.loadStory,
      setStoryId: state.setStoryId,
    }))
  );
};
