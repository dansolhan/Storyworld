import { useEditorStore } from '../../store/useEditorStore';

export const useAtmospheres = () => useEditorStore((state) => state.atmospheres);
