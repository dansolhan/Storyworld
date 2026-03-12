import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const usePageAppearanceState = () => {
  return useEditorStore(
    useShallow((state) => ({
      pageColorMode: state.pageColorMode,
      setPageColorMode: state.setPageColorMode,
    }))
  );
};
