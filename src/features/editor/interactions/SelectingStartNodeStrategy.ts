import { useEditorStore } from '../store/useEditorStore';
import type { InteractionStrategy } from './InteractionStrategy';

export class SelectingStartNodeStrategy implements InteractionStrategy {
  get cursor() {
    return 'crosshair';
  }

  get overlayMessage() {
    return 'Select a page as Start Node';
  }

  onNodeClick(nodeId: string) {
    const state = useEditorStore.getState();
    state.setStartPageId(nodeId);
    state.setIsSelectingStartNode(false);
    state.setIsStorySettingsOpen(true);
  }

  onPaneClick() {
    const state = useEditorStore.getState();
    state.setIsSelectingStartNode(false);
    state.setIsStorySettingsOpen(true);
  }

  onCancel() {
    const state = useEditorStore.getState();
    state.setIsSelectingStartNode(false);
    state.setIsStorySettingsOpen(true);
  }
}
