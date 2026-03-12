import { useEditorStore } from '../../store/useEditorStore';

export const useNodes = () => useEditorStore((state) => state.nodes);
