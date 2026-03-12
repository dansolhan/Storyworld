import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const usePageActions = () => {
  return useEditorStore(
    useShallow((state) => ({
      setSelectedPage: state.setSelectedPage,
      updatePageTitle: state.updatePageTitle,
      updatePageType: state.updatePageType,
    }))
  );
};
