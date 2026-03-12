import { useEditorStore } from '../../store/useEditorStore';

export const useNodesCount = () => useEditorStore((state) => state.nodes.length);
