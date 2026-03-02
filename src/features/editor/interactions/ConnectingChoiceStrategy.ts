import { useEditorStore } from '../store/useEditorStore';
import type { InteractionStrategy } from './InteractionStrategy';

export class ConnectingChoiceStrategy implements InteractionStrategy {
  get cursor() {
    return 'crosshair';
  }

  get overlayMessage() {
    return 'Select a page to connect';
  }

  onNodeClick(nodeId: string) {
    const state = useEditorStore.getState();
    const { connectingChoice } = state;

    if (connectingChoice) {
      state.setChoiceDestination(connectingChoice.sourcePageId, connectingChoice.choiceId, nodeId);
      state.setConnectingChoice(null);
    }
  }

  onNodeDoubleClick() {
    // No-op during connection
  }

  onPaneClick() {
    const state = useEditorStore.getState();
    state.setConnectingChoice(null);
  }

  onCancel() {
    const state = useEditorStore.getState();
    state.setConnectingChoice(null);
  }
}
