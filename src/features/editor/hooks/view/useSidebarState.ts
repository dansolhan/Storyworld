import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useSidebarState = () => {
  return useEditorStore(
    useShallow((state) => ({
      sidebarTab: state.sidebarTab,
      setSidebarTab: state.setSidebarTab,
      isEditorSidebarExpanded: state.isEditorSidebarExpanded,
      setIsEditorSidebarExpanded: state.setIsEditorSidebarExpanded,
    }))
  );
};
