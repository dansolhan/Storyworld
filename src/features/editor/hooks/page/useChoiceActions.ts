import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useChoiceActions = () => {
  return useEditorStore(
    useShallow((state) => ({
      addChoice: state.addChoice,
      updateChoiceText: state.updateChoiceText,
      setConnectingChoice: state.setConnectingChoice,
      createPageFromChoice: state.createPageFromChoice,
    }))
  );
};
