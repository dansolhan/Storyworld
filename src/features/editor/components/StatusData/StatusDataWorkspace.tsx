import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useSentenceLookups } from '../../hooks/data/useSentenceLookups';
import { conditionText } from '../RuleEditor/sentence/conditionText';
import { buildStatusPreview } from './statusPreview';
import { StatusDataRow } from './StatusDataRow';
import { StatusEntryEditor } from './StatusEntryEditor';
import { StatusLedgerPreview } from './StatusLedgerPreview';
import { DeleteEntityDialog } from '../DataWorkspace/DeleteEntityDialog';
import { byStatusPriority } from '../../../../lib/engine/logic/statusVisibility';
import { EMPTY_USAGE } from '../../usage/usageReference';
import type { StatusData } from '../../../../domain/Story/StatusData';
import styles from './StatusDataWorkspace.module.css';

/** From the design: title, value token, SHOWN WHEN, order. */
const COLUMNS = 'minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.5fr) 72px';

/**
 * The reader's ledger, on its own page.
 *
 * Was a modal over the canvas. Conditions read in the same sentence language as
 * every other rule, and the right column shows what a reader would see at the
 * start of the story — including the entries that are hidden and why, which is the
 * one thing a table of conditions cannot tell you.
 */
export const StatusDataWorkspace: React.FC = () => {
  const { statusData, variables, addStatusData, updateStatusData, removeStatusData, setStatusData } =
    useEditorStore(
      useShallow((state) => ({
        statusData: state.statusData,
        variables: state.variables,
        addStatusData: state.addStatusData,
        updateStatusData: state.updateStatusData,
        removeStatusData: state.removeStatusData,
        setStatusData: state.setStatusData,
      }))
    );

  const lookups = useSentenceLookups();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StatusData | null>(null);

  const ordered = useMemo(() => byStatusPriority(statusData ?? []), [statusData]);
  const preview = useMemo(
    () => buildStatusPreview(statusData ?? [], variables ?? {}, lookups),
    [statusData, variables, lookups]
  );

  const selected = ordered.find((entry) => entry.id === selectedId);

  const handleNew = () => {
    const id = `sd-${crypto.randomUUID().slice(0, 8)}`;
    /* Below everything that exists, so a new entry lands at the foot of the ledger. */
    const lowest = Math.min(0, ...ordered.map((entry) => entry.priority ?? 0));
    addStatusData({ id, title: 'New entry', value: '', priority: lowest - 10, condition: [] });
    setSelectedId(id);
  };

  /**
   * Order is stored as a priority, so moving a row means swapping the two rows'
   * priorities rather than reindexing the list — everything else reads priority,
   * including the player.
   */
  const move = (id: string, delta: -1 | 1) => {
    const index = ordered.findIndex((entry) => entry.id === id);
    const target = index + delta;
    if (index === -1 || target < 0 || target >= ordered.length) return;

    const a = ordered[index];
    const b = ordered[target];
    const aPriority = a.priority ?? 0;
    const bPriority = b.priority ?? 0;
    // Equal priorities would leave the swap invisible; nudge them apart.
    const [nextA, nextB] =
      aPriority === bPriority ? [bPriority - delta, bPriority] : [bPriority, aPriority];

    setStatusData(
      (statusData ?? []).map((entry) => {
        if (entry.id === a.id) return { ...entry, priority: nextA };
        if (entry.id === b.id) return { ...entry, priority: nextB };
        return entry;
      })
    );
  };

  return (
    <>
      <div className={styles.workspace}>
        <div className={styles.main}>
          <header className={styles.header}>
            <div className={styles.heading}>
              <h1 className={styles.title}>Status data</h1>
              <p className={styles.explanation}>
                The ledger beside the story. Each entry can be shown only when its condition holds.
              </p>
            </div>

            <button type="button" className={styles.new} onClick={handleNew}>
              <Plus className={styles.newIcon} aria-hidden="true" />
              New entry
            </button>
          </header>

          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: COLUMNS }}>
              <span>Title</span>
              <span>Value</span>
              <span>Shown when</span>
              <span className={styles.orderHeading}>Order</span>
            </div>

            {ordered.length === 0 ? (
              <p className={styles.empty}>
                No entries yet. A story with nothing to track needs none.
              </p>
            ) : (
              <div role="table" aria-label="Status data">
                {ordered.map((entry, index) => (
                  <StatusDataRow
                    key={entry.id}
                    entry={entry}
                    columns={COLUMNS}
                    shownWhen={conditionText(entry.condition, lookups)}
                    isSelected={entry.id === selectedId}
                    canMoveUp={index > 0}
                    canMoveDown={index < ordered.length - 1}
                    onSelect={() => setSelectedId(entry.id)}
                    onMove={(delta) => move(entry.id, delta)}
                  />
                ))}
              </div>
            )}
          </div>

          {selected && (
            <StatusEntryEditor
              entry={selected}
              variables={variables ?? {}}
              onChange={(updates) => updateStatusData(selected.id, updates)}
              onDelete={() => setPendingDelete(selected)}
            />
          )}
        </div>

        <StatusLedgerPreview entries={preview} />
      </div>

      <DeleteEntityDialog
        name={pendingDelete?.title || 'this entry'}
        kind="status entry"
        usage={EMPTY_USAGE}
        isOpen={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeStatusData(pendingDelete.id);
          setSelectedId(null);
          setPendingDelete(null);
        }}
      />
    </>
  );
};
