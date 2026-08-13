import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useDeletePages } from '../page/useDeletePages';
import type { OnNodesChange } from '@xyflow/react';
import type { EditorNode } from '../../store/editorTypes';

export const useGraphHandlers = () => {
  const { onNodesChange, onEdgesChange, onConnect } = useEditorStore(
    useShallow((state) => ({
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
    }))
  );
  const { announceDeleted } = useDeletePages();

  /**
   * React Flow hands node removals to the store, which deletes the pages properly and
   * reports what went. Saying so — and offering them back — is this layer's job, and
   * it is the same offer the inspector's Delete makes.
   */
  const handleNodesChange = useCallback<OnNodesChange<EditorNode>>(
    (changes) => announceDeleted(onNodesChange(changes)),
    [onNodesChange, announceDeleted]
  );

  return { onNodesChange: handleNodesChange, onEdgesChange, onConnect };
};
