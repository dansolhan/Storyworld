export interface InteractionStrategy {
  cursor: string;
  overlayMessage: string | null;
  onNodeClick: (nodeId: string) => void;
  onPaneClick: () => void;
  onCancel: () => void;
}
