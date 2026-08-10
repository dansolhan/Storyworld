import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { TagInput } from '../../../../components/ui/TagInput/TagInput';
import { WhereItAppears } from './WhereItAppears';
import type { StoryVariable, StoryVariableType } from '../../../../domain/Story/Variable';
import type { UsageEntry } from '../../usage/usageReference';
import styles from './DetailPanel.module.css';

export interface VariableDetailProps {
  name: string;
  variable: StoryVariable;
  usage: UsageEntry;
  onDelete: () => void;
}

const coerce = (type: StoryVariableType, raw: string): string | number | boolean => {
  if (type === 'number') return Number(raw) || 0;
  if (type === 'boolean') return raw === 'true';
  return raw;
};

export const VariableDetail: React.FC<VariableDetailProps> = ({
  name,
  variable,
  usage,
  onDelete,
}) => {
  const updateVariable = useEditorStore((state) => state.updateVariable);

  const patch = (updates: Partial<StoryVariable>) =>
    updateVariable(name, { ...variable, ...updates });

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2 className={`${styles.title} ${styles.mono}`}>{name}</h2>
        <button type="button" className={styles.delete} onClick={onDelete}>
          Delete
        </button>
      </header>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Name</span>
        <input
          className={`${styles.input} ${styles.mono} ${styles.readOnly}`}
          value={name}
          readOnly
          aria-describedby={`${name}-name-note`}
        />
        <p className={styles.fieldNote} id={`${name}-name-note`}>
          The name is how everything refers to this, so it cannot be changed. Read by
          lists what a rename would have to touch.
        </p>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Type</span>
        <select
          className={styles.input}
          value={variable.type}
          onChange={(event) => {
            const type = event.target.value as StoryVariableType;
            // Recast the starting value, or it keeps the old type's shape.
            patch({ type, value: coerce(type, String(variable.value)) });
          }}
        >
          <option value="string">Text</option>
          <option value="number">Number</option>
          <option value="boolean">True / false</option>
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Starts as</span>
        {variable.type === 'boolean' ? (
          <select
            className={styles.input}
            value={String(variable.value)}
            onChange={(event) => patch({ value: event.target.value === 'true' })}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        ) : (
          <input
            className={styles.input}
            type={variable.type === 'number' ? 'number' : 'text'}
            value={String(variable.value)}
            onChange={(event) => patch({ value: coerce(variable.type, event.target.value) })}
          />
        )}
      </label>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Tags</span>
        <TagInput
          tags={variable.tags ?? []}
          onChange={(tags) => patch({ tags })}
          placeholder="Add a tag…"
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Print it with</span>
        <div className={styles.tokenRow}>
          <code className={styles.token}>{`{{${name}}}`}</code>
        </div>
      </div>

      <WhereItAppears usage={usage} heading="Read by" />
    </div>
  );
};
