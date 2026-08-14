import React, { useState } from 'react';
import { Check, Download, Pencil, Trash2 } from 'lucide-react';
import { useEngine } from '../../adapter/useEngine';
import { useEngineStore } from '../../adapter/useEngineStore';
import { captureSnapshot, reconcileSnapshot } from '../../../../domain/Story/reconcileSnapshot';
import type { DebugSnapshot } from '../../../../domain/Story/DebugSnapshot';
import type { PlayerDebugBridge } from './PlayerDebugBridge';
import styles from './DebugConsole.module.css';

/** Names what a snapshot lost against the story as it stands now. */
const staleNotice = (snapshot: DebugSnapshot, dropped: { variables: string[]; items: string[]; pages: string[] }): string | null => {
  const parts: string[] = [];
  if (dropped.variables.length) parts.push(`${dropped.variables.length} variable(s)`);
  if (dropped.items.length) parts.push(`${dropped.items.length} item(s)`);
  if (dropped.pages.length) parts.push(`${dropped.pages.length} visited page(s)`);
  if (parts.length === 0) return null;
  return `Loaded “${snapshot.name}” — skipped ${parts.join(', ')} the story no longer defines.`;
};

/**
 * Save and restore named runtime states.
 *
 * A snapshot never carries the reader's position, so loading one leaves you
 * standing where you were. Use the Pages tab to move afterwards.
 */
export const DebugSnapshotsTab: React.FC<PlayerDebugBridge> = ({
  snapshots,
  onSaveSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
}) => {
  const engine = useEngine();
  const variables = useEngineStore((state) => state.variables);
  const inventory = useEngineStore((state) => state.inventory);
  const visitedPageIds = useEngineStore((state) => state.visitedPageIds);
  const storyData = useEngineStore((state) => state.storyData);

  const [draftName, setDraftName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleSave = () => {
    const name = draftName.trim();
    if (!name) return;
    onSaveSnapshot(captureSnapshot(name, { variables, inventory, visitedPageIds }));
    setDraftName('');
    setNotice(`Saved “${name}”.`);
  };

  const handleLoad = (snapshot: DebugSnapshot) => {
    engine.dispatch({ type: 'DEBUG_APPLY_SNAPSHOT', payload: { snapshot } });
    /*
     * The engine reconciles the same way when it applies; this second pass is
     * only so the console can say what was skipped. Both are pure, so they agree.
     */
    const { dropped } = storyData
      ? reconcileSnapshot(snapshot, storyData)
      : { dropped: { variables: [], items: [], pages: [] } };
    setNotice(staleNotice(snapshot, dropped) ?? `Loaded “${snapshot.name}”.`);
  };

  const commitRename = (id: string) => {
    const name = renameDraft.trim();
    if (name) onRenameSnapshot(id, name);
    setRenamingId(null);
  };

  return (
    <div className={styles.tabBody}>
      <div className={styles.actionBar}>
        <input
          type="text"
          className={styles.field}
          placeholder="Name this state"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSave()}
        />
        <button type="button" className={styles.action} onClick={handleSave} disabled={!draftName.trim()}>
          Save
        </button>
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}

      <div className={styles.rows}>
        {snapshots.map((snapshot) => (
          <div key={snapshot.id} className={styles.row}>
            {renamingId === snapshot.id ? (
              <input
                type="text"
                className={styles.field}
                value={renameDraft}
                autoFocus
                onChange={(event) => setRenameDraft(event.target.value)}
                onBlur={() => commitRename(snapshot.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitRename(snapshot.id);
                  if (event.key === 'Escape') setRenamingId(null);
                }}
                aria-label="Snapshot name"
              />
            ) : (
              <div className={styles.rowLabel}>
                <span className={styles.rowName}>{snapshot.name}</span>
                <span className={styles.rowMeta}>
                  {new Date(snapshot.createdAt).toLocaleString()}
                </span>
              </div>
            )}

            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => handleLoad(snapshot)}
                title="Load this state"
                aria-label={`Load ${snapshot.name}`}
              >
                <Download size={13} />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => {
                  setRenamingId(snapshot.id);
                  setRenameDraft(snapshot.name);
                }}
                title="Rename"
                aria-label={`Rename ${snapshot.name}`}
              >
                {renamingId === snapshot.id ? <Check size={13} /> : <Pencil size={13} />}
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => onDeleteSnapshot(snapshot.id)}
                title="Delete"
                aria-label={`Delete ${snapshot.name}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {snapshots.length === 0 && (
          <p className={styles.empty}>
            No saved states yet. Snapshots keep variables, inventory and visited pages —
            not where you are standing.
          </p>
        )}
      </div>
    </div>
  );
};
