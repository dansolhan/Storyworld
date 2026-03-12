import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const usePersistenceState = () => {
  return useEditorStore(
    useShallow((state) => ({
      _hasHydrated: state._hasHydrated,
      setHasHydrated: state.setHasHydrated,
    }))
  );
};
