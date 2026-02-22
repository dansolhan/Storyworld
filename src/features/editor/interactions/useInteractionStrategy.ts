import { useEditorStore } from '../store/useEditorStore';
import { SelectionStrategy } from './SelectionStrategy';
import { ConnectingChoiceStrategy } from './ConnectingChoiceStrategy';
import { SelectingStartNodeStrategy } from './SelectingStartNodeStrategy';
import type { InteractionStrategy } from './InteractionStrategy';

export const useInteractionStrategy = (): InteractionStrategy => {
  // We subscribe to these specific state flags so React Flow re-renders 
  // appropriately when the interaction mode changes (e.g. to update the cursor).
  const isSelectingStartNode = useEditorStore((state) => state.isSelectingStartNode);
  const connectingChoice = useEditorStore((state) => state.connectingChoice);

  if (isSelectingStartNode) {
    return new SelectingStartNodeStrategy();
  }

  if (connectingChoice) {
    return new ConnectingChoiceStrategy();
  }

  return new SelectionStrategy();
};
