import { useEditorStore } from '../../store/useEditorStore';

export const useConnectingChoice = () => useEditorStore((state) => state.connectingChoice);
