import { useEditorStore } from '../../store/useEditorStore';

export const useSelectedPageId = () => useEditorStore((state) => state.selectedPageId);
