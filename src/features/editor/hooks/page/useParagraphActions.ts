import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export const useParagraphActions = () => {
  return useEditorStore(
    useShallow((state) => ({
      addParagraph: state.addParagraph,
      updateParagraph: state.updateParagraph,
    }))
  );
};
