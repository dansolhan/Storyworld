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
  trigger?: 'on_enter' | 'on_exit';
  onChangeTrigger?: (trigger: 'on_enter' | 'on_exit') => void;
  onChangeParam: (key: string, value: unknown) => void;
  onRemove: () => void;
  children?: React.ReactNode;
}

export const BlueprintCard: React.FC<BlueprintCardProps> = ({
  template,
  isGroup,
  params,
  trigger,
  onChangeTrigger,
  onChangeParam,
  onRemove,
  children
}) => {
  const { nodes, variables, subplots } = useEditorStore();
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

        if (key === 'page' || key === 'pageId') {
          const selectedPageId = params[key] as string | null;
          const selectedNode = nodes.find((n: EditorNode) => n.id === selectedPageId);
          const label = selectedNode ? selectedNode.data.title || `Page ${selectedNode.id}` : 'Select a page...';

          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, key)}
            >
              {label}
            </span>
          );
        }

        if (key === 'targetPageId') {
          const selectedPageId = params['targetPageId'] as string | null;
          const selectedNode = nodes.find((n: EditorNode) => n.id === selectedPageId);
          const label = selectedNode ? selectedNode.data.title || `Page ${selectedNode.id}` : 'Select a page...';

          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'targetPageId')}
            >
              {label}
            </span>
          );
        }

        if (key === 'subplotId') {
          const selectedSubplotId = params['subplotId'] as string | null;
          const selectedSubplot = subplots?.find(s => s.id === selectedSubplotId);
          const label = selectedSubplot ? selectedSubplot.name : 'Select a subplot...';

          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'subplotId')}
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

        if (key === 'message') {
          const msg = params.message as string;
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'message', msg || '')}
            >
              {msg ? `"${msg}"` : '...'}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const pageOptions = nodes.map((n: EditorNode) => ({ label: n.data.title || `Page ${n.id}`, value: n.id }));
  // When selecting a target page for a subplot, we might want to filter, but for now we'll show all pages or filter by the selected subplot
  const currentSelectedSubplotId = params['subplotId'] as string | null;
  const targetPageOptions = currentSelectedSubplotId
    ? nodes.filter(n => n.data.subplotId === currentSelectedSubplotId).map(n => ({ label: n.data.title || `Page ${n.id}`, value: n.id }))
    : pageOptions;

  const variableOptions = Object.keys(variables).map((k) => ({ label: k, value: k }));
  const subplotOptions = (subplots || []).map(s => ({ label: s.name, value: s.id }));

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

      {/* Trigger toggle — shown only when the parent passes trigger/onChangeTrigger */}
      {onChangeTrigger && (
        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginRight: '0.25rem' }}>Fires:</span>
          {(['on_enter', 'on_exit'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChangeTrigger(t)}
              style={{
                fontSize: '0.62rem',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-default)',
                cursor: 'pointer',
                background: trigger === t ? 'var(--color-primary-500)' : 'transparent',
                color: trigger === t ? '#fff' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-family-sans)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t === 'on_enter' ? 'On Enter' : 'On Exit'}
            </button>
          ))}
        </div>
      )}

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

        {popoverState.tokenTarget === 'targetPageId' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Select a target page:</p>
            <Combobox
              options={targetPageOptions}
              autoFocus
              onSelect={(val) => {
                onChangeParam('targetPageId', val);
                handleClosePopover();
              }}
            />
          </div>
        )}

        {popoverState.tokenTarget === 'subplotId' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Select a subplot:</p>
            <Combobox
              options={subplotOptions}
              autoFocus
              onSelect={(val) => {
                // If they change subplot, reset target page to avoid invalid combinations
                if (params['subplotId'] !== val) {
                  onChangeParam('targetPageId', null);
                }
                onChangeParam('subplotId', val);
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

        {popoverState.tokenTarget === 'message' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '240px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Post message text:</p>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                placeholder="Message to inject next page..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onChangeParam('message', inputValue);
                    handleClosePopover();
                  }
                }}
                style={{ flex: 1, padding: '0.25rem', border: '1px solid #ccc', borderRadius: '3px' }}
              />
              <button
                onClick={() => {
                  onChangeParam('message', inputValue);
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
