import React, { useState, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Pencil, Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import { Button } from '../../../../components/ui/Button/Button';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { BlueprintCard } from '../shared/BlueprintCard';
import type { StatusData } from '../../../../domain/Story/StatusData';
import type { Conditional } from '../../../../domain/Conditionals/Conditional';
import styles from './StatusDataManager.module.css';

// ─── Inline Standalone Conditional Editor ────────────────────────────────────
// StatusData conditionals aren't page-scoped, so we manage them directly on the
// StatusData object rather than going through the page-scoped conditionalSlice.

interface StandaloneConditionalsEditorProps {
  conditionals: Conditional[];
  onChange: (conditionals: Conditional[]) => void;
}

const StandaloneConditionalsEditor: React.FC<StandaloneConditionalsEditorProps> = ({ conditionals, onChange }) => {
  const handleAddConditional = (blueprintId: string) => {
    if (!blueprintId) return;
    const blueprint = conditionalBlueprints[blueprintId];
    if (!blueprint) return;
    const newCond: Conditional = {
      id: `cond-sd-${Date.now()}`,
      blueprintId,
      params: JSON.parse(JSON.stringify(blueprint.defaultParams)),
    };
    onChange([...conditionals, newCond]);
  };

  const handleUpdateParam = (condId: string, key: string, value: unknown) => {
    onChange(
      conditionals.map((c) =>
        c.id === condId ? { ...c, params: { ...c.params, [key]: value } } : c
      )
    );
  };

  const handleRemove = (condId: string) => {
    onChange(conditionals.filter((c) => c.id !== condId));
  };

  return (
    <div className={styles.conditionalSection}>
      <div className={styles.conditionalLabel}>Conditionals ({conditionals.length})</div>
      {conditionals.map((cond) => {
        const blueprint = conditionalBlueprints[cond.blueprintId];
        if (!blueprint) return null;
        return (
          <BlueprintCard
            key={cond.id}
            template={blueprint.template}
            isGroup={false}
            params={cond.params}
            onChangeParam={(key, val) => handleUpdateParam(cond.id, key, val)}
            onRemove={() => handleRemove(cond.id)}
          />
        );
      })}
      <select
        className={styles.comboboxSelect}
        value=""
        onChange={(e) => {
          if (e.target.value) handleAddConditional(e.target.value);
        }}
      >
        <option value="" disabled>+ Add conditional...</option>
        {Object.values(conditionalBlueprints).map((bp) => (
          <option key={bp.id} value={bp.id}>{bp.name}</option>
        ))}
      </select>
    </div>
  );
};

// ─── Variable Picker Button ───────────────────────────────────────────────────
interface VariablePickerProps {
  variables: Record<string, { type: string }>;
  onInsert: (varName: string) => void;
}

const VariablePicker: React.FC<VariablePickerProps> = ({ variables, onInsert }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const varNames = Object.keys(variables);

  return (
    <div className={styles.variableDropdownWrapper} ref={ref}>
      <button className={styles.variableButton} type="button" onClick={() => setOpen(!open)}>
        {'{{ }} Insert Variable'}
      </button>
      {open && (
        <div className={styles.variableDropdown}>
          {varNames.length === 0 && (
            <div className={styles.variableDropdownItem} style={{ fontStyle: 'italic' }}>No variables defined</div>
          )}
          {varNames.map((name) => (
            <div
              key={name}
              className={styles.variableDropdownItem}
              onClick={() => { onInsert(name); setOpen(false); }}
            >
              {`{{${name}}}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Entry Row ────────────────────────────────────────────────────────────────
interface EntryRowProps {
  entry: StatusData;
  variables: Record<string, { type: string }>;
  onUpdate: (id: string, updates: Partial<StatusData>) => void;
  onRemove: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const EntryRow: React.FC<EntryRowProps> = ({ entry, variables, onUpdate, onRemove, onMoveUp, onMoveDown }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valueInputRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = (varName: string) => {
    const input = valueInputRef.current;
    if (!input) return;
    const val = entry.value ?? '';
    const start = input.selectionStart ?? val.length;
    const end = input.selectionEnd ?? val.length;
    const before = val.slice(0, start);
    const after = val.slice(end);
    const inserted = `{{${varName}}}`;
    onUpdate(entry.id, { value: before + inserted + after });
    // Restore cursor after next render tick
    setTimeout(() => {
      input.focus();
      const pos = start + inserted.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

  if (!isEditing) {
    return (
      <div className={styles.entryRow}>
        {entry.color && (
          <span className={styles.colorDot} style={{ backgroundColor: entry.color }} title={entry.color} />
        )}
        <div className={styles.entryInfo}>
          <div className={styles.entryTitle}>{entry.title}</div>
          <div className={styles.entryValue}>{entry.value}</div>
          <div className={styles.entryMeta}>
            <span>Priority: {entry.priority ?? 0}</span>
            {(entry.conditionals?.length ?? 0) > 0 && (
              <span>{entry.conditionals!.length} conditional{entry.conditionals!.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className={styles.entryActions}>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit">
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onMoveUp} aria-label="Move up">
            <ChevronUp size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onMoveDown} aria-label="Move down">
            <ChevronDown size={14} />
          </Button>
          <Button
            variant={confirmDelete ? 'danger' : 'ghost-danger'}
            size={confirmDelete ? 'sm' : 'icon'}
            onClick={() => confirmDelete ? onRemove(entry.id) : setConfirmDelete(true)}
            onMouseLeave={() => setConfirmDelete(false)}
            aria-label="Delete"
          >
            <Trash2 size={14} color={confirmDelete ? 'white' : 'currentColor'} />
            {confirmDelete && <span style={{ marginLeft: '4px', whiteSpace: 'nowrap' }}>Confirm</span>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.entryRow} style={{ flexDirection: 'column', gap: 10 }}>
      <div className={styles.addFormRow}>
        <input
          className={styles.input}
          placeholder="Title (e.g. Gold)"
          value={entry.title}
          onChange={(e) => onUpdate(entry.id, { title: e.target.value })}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          className={`${styles.input} ${styles.inputNarrow}`}
          placeholder="Priority"
          value={entry.priority ?? 0}
          onChange={(e) => onUpdate(entry.id, { priority: Number(e.target.value) })}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', flexShrink: 0 }}>
          Color
          <input
            type="color"
            className={styles.colorPicker}
            value={entry.color || '#c9a84c'}
            onChange={(e) => onUpdate(entry.id, { color: e.target.value })}
          />
        </label>
        <button
          type="button"
          title="Clear color — use default text color"
          style={{ fontSize: '0.75rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', cursor: 'pointer', background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}
          onClick={() => onUpdate(entry.id, { color: undefined })}
        >
          ✕ color
        </button>
      </div>

      <div className={styles.addFormRow}>
        <input
          ref={valueInputRef}
          className={styles.input}
          placeholder='Value, e.g. {{gold}} gold coins'
          value={entry.value}
          onChange={(e) => onUpdate(entry.id, { value: e.target.value })}
          style={{ flex: 1 }}
        />
        <VariablePicker variables={variables} onInsert={handleInsertVariable} />
      </div>

      <StandaloneConditionalsEditor
        conditionals={entry.conditionals || []}
        onChange={(conds) => onUpdate(entry.id, { conditionals: conds })}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Done</Button>
      </div>
    </div>
  );
};

// ─── Main Manager ─────────────────────────────────────────────────────────────
interface StatusDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusDataManager: React.FC<StatusDataManagerProps> = React.memo(({ isOpen, onClose }) => {
  const { statusData, addStatusData, updateStatusData, removeStatusData, setStatusData, variables } = useEditorStore(
    useShallow((state) => ({
      statusData: state.statusData,
      addStatusData: state.addStatusData,
      updateStatusData: state.updateStatusData,
      removeStatusData: state.removeStatusData,
      setStatusData: state.setStatusData,
      variables: state.variables,
    }))
  );

  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newPriority, setNewPriority] = useState(0);
  const [newColor, setNewColor] = useState('');
  const newValueRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const entry: StatusData = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      titleLocId: crypto.randomUUID(),
      value: newValue,
      valueLocId: crypto.randomUUID(),
      priority: newPriority || 0,
      color: newColor || undefined,
      conditionals: [],
    };
    addStatusData(entry);
    setNewTitle('');
    setNewValue('');
    setNewPriority(0);
    setNewColor('');
  };

  const handleInsertNewVariable = (varName: string) => {
    const input = newValueRef.current;
    if (!input) return;
    const start = input.selectionStart ?? newValue.length;
    const end = input.selectionEnd ?? newValue.length;
    const inserted = `{{${varName}}}`;
    const next = newValue.slice(0, start) + inserted + newValue.slice(end);
    setNewValue(next);
    setTimeout(() => {
      input.focus();
      const pos = start + inserted.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...statusData];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setStatusData(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === statusData.length - 1) return;
    const next = [...statusData];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setStatusData(next);
  };

  return (
    <ExpandableBottomPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Status Data"
      defaultHeight="450px"
      expandedHeight="100%"
    >
      <div className={styles.container}>
        <p className={styles.description}>
          Status data entries are displayed above the inventory in the player. Use <code>{'{{variableName}}'}</code> to embed variable values.
        </p>

        {/* Add Form */}
        <div className={styles.addForm}>
          <div className={styles.addFormRow}>
            <input
              className={styles.input}
              placeholder="Title (e.g. Gold)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1.5 }}
            />
            <input
              ref={newValueRef}
              className={styles.input}
              placeholder='Value (e.g. {{gold}})'
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              style={{ flex: 2 }}
            />
          </div>
          <div className={styles.addFormRow}>
            <input
              type="number"
              className={`${styles.input} ${styles.inputNarrow}`}
              placeholder="Priority"
              value={newPriority}
              onChange={(e) => setNewPriority(Number(e.target.value))}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
              Color (optional)
              <input
                type="color"
                className={styles.colorPicker}
                value={newColor || '#c9a84c'}
                onChange={(e) => setNewColor(e.target.value)}
              />
            </label>
            {newColor && (
              <button
                type="button"
                style={{ fontSize: '0.75rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-secondary)' }}
                onClick={() => setNewColor('')}
              >✕ color</button>
            )}
            <VariablePicker variables={variables} onInsert={handleInsertNewVariable} />
            <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
              <Plus size={14} style={{ marginRight: 4 }} /> Add Entry
            </Button>
          </div>
        </div>

        {/* List */}
        <div className={styles.list}>
          {statusData.length === 0 && (
            <p className={styles.empty}>No status data entries yet. Add one above.</p>
          )}
          {statusData.map((entry, index) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              variables={variables}
              onUpdate={(id, updates) => updateStatusData(id, updates)}
              onRemove={(id) => removeStatusData(id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))}
        </div>
      </div>
    </ExpandableBottomPanel>
  );
});
