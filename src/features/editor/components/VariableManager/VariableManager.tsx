import React, { useState, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import { Button } from '../../../../components/ui/Button/Button';
import { TagInput } from '../../../../components/ui/TagInput/TagInput';
import type { StoryVariableType, StoryVariable } from '../../../../domain/Story/Variable';
import styles from './VariableManager.module.css';

interface VariableRowProps {
  variableKey: string;
  variable: StoryVariable;
  updateVariable: (key: string, value: StoryVariable) => void;
  removeVariable: (key: string) => void;
}

const VariableRow: React.FC<VariableRowProps> = ({ variableKey, variable, updateVariable, removeVariable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const renderEditValueInput = () => {
    if (variable.type === 'boolean') {
      return (
        <select
          className={styles.input}
          value={String(variable.value)}
          onChange={(e) => updateVariable(variableKey, { ...variable, value: e.target.value === 'true' })}
          style={{ width: '80px', flex: 'none' }}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }
    if (variable.type === 'number') {
      return (
        <input
          type="number"
          className={styles.input}
          value={(variable.value as number) || 0}
          onChange={(e) => updateVariable(variableKey, { ...variable, value: Number(e.target.value) })}
          placeholder="Value"
          style={{ width: '100px', flex: 'none' }}
        />
      );
    }
    return (
      <input
        type="text"
        className={styles.input}
        value={String(variable.value)}
        onChange={(e) => updateVariable(variableKey, { ...variable, value: e.target.value })}
        placeholder="Value"
      />
    );
  };

  const handleEditTags = (tags: string[]) => {
    updateVariable(variableKey, { ...variable, tags });
  };

  if (!isEditing) {
    return (
      <div className={styles.variableRow}>
        <div className={styles.keyDisplay}>
          {variableKey} <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>({variable.type})</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
            {variable.tags?.map((tag, idx) => (
              <span key={idx} className={styles.chip}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, fontFamily: 'monospace' }}>
          {String(variable.value)}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit">
            <Pencil size={16} />
          </Button>
          <Button
            variant={confirmDelete ? "danger" : "ghost-danger"}
            size={confirmDelete ? "sm" : "icon"}
            onClick={() => {
              if (confirmDelete) {
                removeVariable(variableKey);
              } else {
                setConfirmDelete(true);
              }
            }}
            onMouseLeave={() => setConfirmDelete(false)}
            aria-label="Delete"
          >
            <Trash2 size={16} color={confirmDelete ? 'white' : 'currentColor'} />
            {confirmDelete && <span style={{ marginLeft: '4px', whiteSpace: 'nowrap' }}>Click to confirm</span>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.variableRow}>
      <div className={styles.keyDisplay} style={{ alignSelf: 'flex-start', paddingTop: '8px' }}>
        {variableKey} <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>({variable.type})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {renderEditValueInput()}
        </div>
        <TagInput
          tags={variable.tags || []}
          onChange={handleEditTags}
          placeholder="Add tags..."
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'flex-start' }}>
        <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Done</Button>
      </div>
    </div>
  );
};

interface VariableManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({ isOpen, onClose }) => {
  const { variables, addVariable, updateVariable, removeVariable } = useEditorStore();

  const [filterText, setFilterText] = useState('');

  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState<StoryVariableType>('string');
  const [newValue, setNewValue] = useState<string | number | boolean>('');
  const [newTags, setNewTags] = useState<string[]>([]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as StoryVariableType;
    setNewType(type);
    if (type === 'boolean') setNewValue(false);
    else if (type === 'number') setNewValue(0);
    else setNewValue('');
  };

  const handleAdd = () => {
    if (newKey && !variables[newKey]) {
      addVariable(newKey, { type: newType, value: newValue, tags: newTags });
      setNewKey('');
      setNewType('string');
      setNewValue('');
      setNewTags([]);
    }
  };

  const renderAddValueInput = () => {
    if (newType === 'boolean') {
      return (
        <select
          className={styles.input}
          value={String(newValue)}
          onChange={(e) => setNewValue(e.target.value === 'true')}
          style={{ width: '80px', flex: 'none' }}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }
    if (newType === 'number') {
      return (
        <input
          type="number"
          className={styles.input}
          placeholder="Value"
          value={newValue as number}
          onChange={(e) => setNewValue(Number(e.target.value))}
          style={{ width: '100px', flex: 'none' }}
        />
      );
    }
    return (
      <input
        type="text"
        className={styles.input}
        placeholder="Value"
        value={newValue as string}
        onChange={(e) => setNewValue(e.target.value)}
      />
    );
  };


  const filteredVariables = useMemo(() => {
    const query = filterText.toLowerCase();
    if (!query) return Object.entries(variables);

    return Object.entries(variables).filter(([key, opt]) => {
      const matchKey = key.toLowerCase().includes(query);
      const matchTags = opt.tags?.some(tag => tag.toLowerCase().includes(query));
      return matchKey || matchTags;
    });
  }, [variables, filterText]);

  return (
    <ExpandableBottomPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Global Variables"
      defaultHeight="400px"
      expandedHeight="100%"
    >
      <div className={styles.container}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <p className={styles.description} style={{ flex: 1, margin: 0 }}>
            Use in paragraphs: <code>{'{'}{'{'}playerName{'}'}{'}'}</code>
          </p>
          <input
            type="text"
            placeholder="Search by name or tags..."
            className={styles.input}
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ width: '200px', flex: 'none' }}
          />
        </div>

        {/* Add Variable Form */}
        <div className={styles.addForm}>
          <input
            type="text"
            className={styles.input}
            placeholder="Name (e.g. playerName)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={{ flex: 2 }}
          />
          <select
            className={styles.input}
            value={newType}
            onChange={handleTypeChange}
            style={{ width: '90px', flex: 'none' }}
          >
            <option value="string">Text</option>
            <option value="number">Num</option>
            <option value="boolean">Bool</option>
          </select>
          {renderAddValueInput()}
          <TagInput
            tags={newTags}
            onChange={setNewTags}
            placeholder="Add tags..."
            style={{ flex: 2 }}
          />
          <Button onClick={handleAdd} size="sm" disabled={!newKey}>Add</Button>
        </div>

        <div className={styles.list}>
          {filteredVariables.map(([key, variable]) => (
            <VariableRow
              key={key}
              variableKey={key}
              variable={variable}
              updateVariable={updateVariable}
              removeVariable={removeVariable}
            />
          ))}
          {filteredVariables.length === 0 && (
            <p className={styles.empty}>No variables matched.</p>
          )}
        </div>
      </div>
    </ExpandableBottomPanel>
  );
};

