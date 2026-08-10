import { useEditorStore } from '../store/useEditorStore';
import type { InteractionStrategy } from './InteractionStrategy';

export class SelectionStrategy implements InteractionStrategy {
  get cursor() {
    return 'default';
  }

  get overlayMessage() {
    return null;
  }

  onNodeClick(nodeId: string) {
    const state = useEditorStore.getState();
    state.setSelectedPage(nodeId);
  }

  onNodeDoubleClick(nodeId: string) {
    // The inspector is always open now, so selecting is all there is to do.
    useEditorStore.getState().setSelectedPage(nodeId);
  }

  onPaneClick() {
    const state = useEditorStore.getState();
    state.setSelectedPage(null);
  }

  onCancel() {
    // No-op for default selection state
  }
}
