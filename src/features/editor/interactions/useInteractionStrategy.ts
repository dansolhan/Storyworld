import { useEditorStore } from '../store/useEditorStore';
import { SelectionStrategy } from './SelectionStrategy';
import { ConnectingChoiceStrategy } from './ConnectingChoiceStrategy';
import { SelectingStartNodeStrategy } from './SelectingStartNodeStrategy';
import type { InteractionStrategy } from './InteractionStrategy';

// Strategies are stateless wrappers over useEditorStore.getState(),
// so a single instance per kind is sufficient and keeps references stable.
const SELECTION_STRATEGY = new SelectionStrategy();
const CONNECTING_CHOICE_STRATEGY = new ConnectingChoiceStrategy();
const SELECTING_START_NODE_STRATEGY = new SelectingStartNodeStrategy();

export const useInteractionStrategy = (): InteractionStrategy => {
  const isSelectingStartNode = useEditorStore((state) => state.isSelectingStartNode);
  const connectingChoice = useEditorStore((state) => state.connectingChoice);

  if (isSelectingStartNode) return SELECTING_START_NODE_STRATEGY;
  if (connectingChoice) return CONNECTING_CHOICE_STRATEGY;
  return SELECTION_STRATEGY;
};
