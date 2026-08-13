import React from 'react';
import { ConditionListEditor } from '../RuleEditor/ConditionListEditor';
import { ATMOSPHERE_COLOURS } from '../Atmospheres/atmospherePalette';
import type { StatusData } from '../../../../domain/Story/StatusData';
import type { StoryVariable } from '../../../../domain/Story/Variable';
import styles from './StatusDataWorkspace.module.css';

export interface StatusEntryEditorProps {
  entry: StatusData;
  variables: Record<string, StoryVariable>;
  onChange: (updates: Partial<StatusData>) => void;
  onDelete: () => void;
}

/**
 * The selected entry, edited in place below the table.
 *
 * Inline rather than in a side panel: the ledger preview already owns the right
 * column, and an entry's fields are few enough to sit under the row they belong to.
 */
export const StatusEntryEditor: React.FC<StatusEntryEditorProps> = ({
  entry,
  variables,
  onChange,
  onDelete,
}) => {
  const insertVariable = (name: string) => {
    if (!name) return;
    onChange({ value: `${entry.value ?? ''}{{${name}}}` });
  };

  return (
    <section className={styles.editor} aria-label={`Editing ${entry.title || 'entry'}`}>
      <div className={styles.editorGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Title</span>
          <input
            className={styles.input}
            value={entry.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Value</span>
          <div className={styles.valueRow}>
            <input
              className={styles.input}
              value={entry.value ?? ''}
              placeholder="{{hp}} / {{maxHp}}"
              onChange={(event) => onChange({ value: event.target.value })}
            />
            {/*
              A select rather than a picker dialog: the whole job is appending one
              token, and the variable names are already a short list.
            */}
            <select
              className={styles.insert}
              value=""
              aria-label="Insert variable"
              onChange={(event) => insertVariable(event.target.value)}
            >
              <option value="">Insert variable…</option>
              {Object.keys(variables).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Colour</span>
          <div className={styles.swatches}>
            <button
              type="button"
              className={styles.swatchNone}
              data-selected={!entry.color || undefined}
              aria-label="No colour"
              onClick={() => onChange({ color: undefined })}
            >
              none
            </button>
            {ATMOSPHERE_COLOURS.map((colour) => (
              <button
                key={colour.value}
                type="button"
                className={styles.swatch}
                style={{ backgroundColor: colour.value }}
                data-selected={entry.color === colour.value || undefined}
                aria-label={colour.label}
                onClick={() => onChange({ color: colour.value })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Shown when</span>
        <ConditionListEditor
          condition={entry.condition ?? []}
          emptyLabel="Always shown."
          onChange={(condition) => onChange({ condition })}
        />
      </div>

      <button type="button" className={styles.delete} onClick={onDelete}>
        Delete this entry
      </button>
    </section>
  );
};
