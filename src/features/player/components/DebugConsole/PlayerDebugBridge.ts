import type { DebugSnapshot } from '../../../../domain/Story/DebugSnapshot';

/**
 * How the player asks the editor to keep a snapshot.
 *
 * Passed down as props rather than reached for through a store, because
 * snapshots are authoring data and the editor owns them. Nothing under
 * `features/player` imports `useEditorStore`, so the two state applications stay
 * isolated — and a play launched without this prop has no console at all, which
 * is what keeps debug mode structurally impossible in a published story.
 */
export interface PlayerDebugBridge {
  snapshots: DebugSnapshot[];
  onSaveSnapshot: (snapshot: DebugSnapshot) => void;
  onRenameSnapshot: (id: string, name: string) => void;
  onDeleteSnapshot: (id: string) => void;
}
