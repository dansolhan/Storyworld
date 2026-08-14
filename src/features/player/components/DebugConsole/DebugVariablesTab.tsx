import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useEngine } from '../../adapter/useEngine';
import { useEngineStore } from '../../adapter/useEngineStore';
import type { StoryVariable } from '../../../../domain/Story/Variable';
import styles from './DebugConsole.module.css';

interface VariableFieldProps {
  variableKey: string;
  variable: StoryVariable;
  onChange: (value: string | number | boolean) => void;
}

/** The control the variable's declared type calls for — never a bare text box. */
const VariableField: React.FC<VariableFieldProps> = ({ variableKey, variable, onChange }) => {
  if (variable.type === 'boolean') {
    return (
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={Boolean(variable.value)}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={variableKey}
        />
        <span>{variable.value ? 'true' : 'false'}</span>
      </label>
    );
  }

  if (variable.type === 'number') {
    return (
      <input
        type="number"
        className={`${styles.field} ${styles.fieldNumeric}`}
        value={Number(variable.value)}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={variableKey}
      />
    );
  }

  return (
    <input
      type="text"
      className={styles.field}
      value={String(variable.value)}
      onChange={(event) => onChange(event.target.value)}
      aria-label={variableKey}
    />
  );
};

/**
 * Every variable in the story, live.
 *
 * Writes go out as `DEBUG_SET_VARIABLE` rather than straight into the store, so a
 * value typed here lands through exactly the coercion an action would use.
 */
export const DebugVariablesTab: React.FC = () => {
  const engine = useEngine();
  const variables = useEngineStore((state) => state.variables);
  const declared = useEngineStore((state) => state.storyData?.variables);
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return Object.entries(variables)
      .filter(([key, variable]) => {
        if (!query) return true;
        return (
          key.toLowerCase().includes(query) ||
          variable.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [variables, filter]);

  const setVariable = (key: string, value: string | number | boolean) =>
    engine.dispatch({ type: 'DEBUG_SET_VARIABLE', payload: { key, value } });

  return (
    <div className={styles.tabBody}>
      <input
        type="search"
        className={styles.field}
        placeholder="Filter by name or tag"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      <div className={styles.rows}>
        {rows.map(([key, variable]) => {
          const authored = declared?.[key];
          // A dot beside the name is the whole "what has this playthrough changed" story.
          const isDirty = authored !== undefined && authored.value !== variable.value;

          return (
            <div key={key} className={styles.row}>
              <div className={styles.rowLabel}>
                <span className={styles.rowName}>
                  {isDirty && <span className={styles.dirtyDot} aria-label="Changed this session" />}
                  {key}
                </span>
                <span className={styles.rowMeta}>{variable.type}</span>
              </div>

              <VariableField
                variableKey={key}
                variable={variable}
                onChange={(value) => setVariable(key, value)}
              />

              {isDirty && (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setVariable(key, authored.value)}
                  title={`Reset to ${String(authored.value)}`}
                  aria-label={`Reset ${key}`}
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className={styles.empty}>
            {filter ? 'No variable matched.' : 'This story declares no variables.'}
          </p>
        )}
      </div>
    </div>
  );
};
