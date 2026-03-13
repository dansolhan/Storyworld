import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useEdgeVisibilityState = () => {
  return useEditorStore(
    useShallow((state) => ({
      showAllEdges: state.showAllEdges,
      setShowAllEdges: state.setShowAllEdges,
    }))
  );
};
