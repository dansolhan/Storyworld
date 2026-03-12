import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useInteractionState = () => {
  return useEditorStore(
    useShallow((state) => ({
      isDragging: state.isDragging,
      setIsDragging: state.setIsDragging,
      isPanning: state.isPanning,
      setIsPanning: state.setIsPanning,
    }))
  );
};
