import { useEditorStore } from '../../store/useEditorStore';

export const useEdges = () => useEditorStore((state) => state.edges);
