import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useUsageIndex, usageFor } from '../../hooks/data/useUsageIndex';
import { useFilteredEntries } from '../../hooks/data/useFilteredEntries';
import { DataWorkspace } from './DataWorkspace';
import { DataRow } from './DataRow';
import { VariableDetail } from './VariableDetail';
import { DeleteEntityDialog } from './DeleteEntityDialog';
import { NewVariableDialog } from './NewVariableDialog';
import type { StoryVariable, StoryVariableType } from '../../../../domain/Story/Variable';
import rowStyles from './DataRow.module.css';

/** From the design (5b): 1.4fr .7fr 1fr 1fr .6fr. */
const COLUMNS =
  'minmax(0, 1.4fr) minmax(0, 0.7fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.6fr)';

const TYPE_LABELS: Record<StoryVariableType, string> = {
  string: 'Text',
  number: 'Number',
  boolean: 'True / false',
};

const STARTING_VALUE: Record<StoryVariableType, string | number | boolean> = {
  string: '',
  number: 0,
  boolean: false,
};

export const VariablesWorkspace: React.FC = () => {
  const { variables, addVariable, removeVariable } = useEditorStore(
    useShallow((state) => ({
      variables: state.variables,
      addVariable: state.addVariable,
      removeVariable: state.removeVariable,
    }))
  );

  const usage = useUsageIndex();
  const [filter, setFilter] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const entries = useMemo(
    () =>
      Object.entries(variables ?? {}).map(([name, variable]) => ({
        name,
        variable,
        haystack: [name, variable.type, ...(variable.tags ?? [])].join(' ').toLowerCase(),
      })),
    [variables]
  );
  const visible = useFilteredEntries(entries, filter);

  const selected = selectedName ? variables?.[selectedName] : undefined;

  const handleCreate = (name: string, type: StoryVariableType) => {
    const variable: StoryVariable = { type, value: STARTING_VALUE[type], tags: [] };
    addVariable(name, variable);
    setSelectedName(name);
    setIsCreating(false);
  };

  return (
    <>
      <DataWorkspace
        title="Variables"
        explanation="What the story remembers about the reader as they go."
        filter={filter}
        onFilterChange={setFilter}
        filterPlaceholder="Filter by name, type or tag…"
        newLabel="New variable"
        onNew={() => setIsCreating(true)}
        columns={['Name', 'Type', 'Starts as', 'Tags', 'Read by']}
        columnTemplate={COLUMNS}
        isEmpty={visible.length === 0}
        emptyMessage={
          entries.length === 0
            ? 'No variables yet. Anything the story needs to remember starts here.'
            : 'Nothing matches that filter.'
        }
        detail={
          selected &&
          selectedName && (
            <VariableDetail
              name={selectedName}
              variable={selected}
              usage={usageFor(usage, 'variable', selectedName)}
              onDelete={() => setPendingDelete(selectedName)}
            />
          )
        }
      >
        {visible.map(({ name, variable }) => {
          const readBy = usageFor(usage, 'variable', name).references.length;
          return (
            <DataRow
              key={name}
              label={name}
              isSelected={name === selectedName}
              onSelect={() => setSelectedName(name)}
              columnTemplate={COLUMNS}
            >
              <span className={rowStyles.mono}>{name}</span>
              <span className={rowStyles.name}>{TYPE_LABELS[variable.type]}</span>
              <span className={rowStyles.mono}>{String(variable.value)}</span>
              <span className={rowStyles.tags}>{(variable.tags ?? []).join(' · ')}</span>
              {/* A variable nothing reads is dead weight, so zero is called out. */}
              <span className={readBy === 0 ? rowStyles.unused : rowStyles.usage}>
                {readBy === 0 ? 'never read' : String(readBy)}
              </span>
            </DataRow>
          );
        })}
      </DataWorkspace>

      {/* Mounted only while open, so its own fields reset each time. */}
      {isCreating && (
        <NewVariableDialog
          isOpen
          existingNames={Object.keys(variables ?? {})}
          onCancel={() => setIsCreating(false)}
          onCreate={handleCreate}
        />
      )}

      {pendingDelete && (
        <DeleteEntityDialog
          isOpen
          name={pendingDelete}
          kind="variable"
          usage={usageFor(usage, 'variable', pendingDelete)}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeVariable(pendingDelete);
            if (selectedName === pendingDelete) setSelectedName(null);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
};
