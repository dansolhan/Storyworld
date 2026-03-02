import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import type { EditorNode } from '../../store/editorTypes';
import { Popover } from '../../../../components/ui/Popover/Popover';
import { Combobox } from '../../../../components/ui/Combobox/Combobox';
import styles from './BlueprintCard.module.css';

interface BlueprintCardProps {
  template: string;
  isGroup?: boolean;
  params: Record<string, unknown>;
  onChangeParam: (key: string, value: unknown) => void;
  onRemove: () => void;
  children?: React.ReactNode;
}

export const BlueprintCard: React.FC<BlueprintCardProps> = ({
  template,
  isGroup,
  params,
  onChangeParam,
  onRemove,
  children
}) => {
  const { nodes, variables } = useEditorStore();
  const [popoverState, setPopoverState] = useState<{ isOpen: boolean; x: number; y: number; tokenTarget: string }>({
    isOpen: false,
    x: 0,
    y: 0,
    tokenTarget: '',
  });

  // State for free-text inputs like 'value'
  const [inputValue, setInputValue] = useState('');

  const handleToggleBoolean = (key: string) => {
    onChangeParam(key, !params[key]);
  };

  const handleOpenPopover = (e: React.MouseEvent, tokenKey: string, initialValue?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverState({
      isOpen: true,
      x: rect.left,
      y: rect.bottom + 5,
      tokenTarget: tokenKey,
    });
    if (initialValue !== undefined) {
      setInputValue(initialValue);
    }
  };

  const handleClosePopover = () => {
    setPopoverState((prev) => ({ ...prev, isOpen: false }));
  };

  const renderTemplate = () => {
    const parts = template.split(/({{\w+}})/g);

    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2);

        if (key === 'not') {
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={() => handleToggleBoolean('not')}
            >
              {params.not ? 'NOT' : '(optionally NOT)'}
            </span>
          );
        }

        if (key === 'page') {
          const selectedPageId = params.pageId as string | null;
          const selectedNode = nodes.find((n: EditorNode) => n.id === selectedPageId);
          const label = selectedNode ? selectedNode.data.title || `Page ${selectedNode.id}` : 'Select a page...';

          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'pageId')}
            >
              {label}
            </span>
          );
        }

        if (key === 'variable') {
          const varKey = params.variableKey as string | null;
          const label = varKey ? varKey : 'Select variable...';
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'variableKey')}
            >
              {label}
            </span>
          );
        }

        if (key === 'value') {
          const val = params.value as string;
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'value', val || '')}
            >
              {val || '...'}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const pageOptions = nodes.map((n: EditorNode) => ({ label: n.data.title || `Page ${n.id}`, value: n.id }));
  const variableOptions = Object.keys(variables).map((k) => ({ label: k, value: k }));

  return (
    <div className={styles.card} style={isGroup ? { flexDirection: 'column', alignItems: 'stretch' } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={styles.cardText}>
          {renderTemplate()}
        </div>
        <button
          className={styles.deleteBtn}
          onClick={onRemove}
          title="Remove Item"
        >
          &times;
        </button>
      </div>

      {children}

      <Popover
        isOpen={popoverState.isOpen}
        x={popoverState.x}
        y={popoverState.y}
        onClose={handleClosePopover}
      >
        {popoverState.tokenTarget === 'pageId' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Select a page:</p>
            <Combobox
              options={pageOptions}
              autoFocus
              onSelect={(val) => {
                onChangeParam('pageId', val);
                handleClosePopover();
              }}
            />
          </div>
        )}

        {popoverState.tokenTarget === 'variableKey' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Select a variable:</p>
            {variableOptions.length > 0 ? (
              <Combobox
                options={variableOptions}
                autoFocus
                onSelect={(val) => {
                  onChangeParam('variableKey', val);
                  handleClosePopover();
                }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>No variables defined yet.</p>
            )}
          </div>
        )}

        {popoverState.tokenTarget === 'value' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Set value:</p>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onChangeParam('value', inputValue);
                    handleClosePopover();
                  }
                }}
                style={{ flex: 1, padding: '0.25rem', border: '1px solid #ccc', borderRadius: '3px' }}
              />
              <button
                onClick={() => {
                  onChangeParam('value', inputValue);
                  handleClosePopover();
                }}
                style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Popover>
    </div>
  );
};
