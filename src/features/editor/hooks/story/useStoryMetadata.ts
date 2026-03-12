import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useStoryMetadata = () => {
  return useEditorStore(
    useShallow((state) => ({
      storyId: state.storyId,
      storyTitle: state.storyTitle,
      storyDescription: state.storyDescription,
      startPageId: state.startPageId,
    }))
  );
};
