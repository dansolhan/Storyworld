import { useEditorStore } from '../../store/useEditorStore';

export const useSubplots = () => useEditorStore((state) => state.subplots);
