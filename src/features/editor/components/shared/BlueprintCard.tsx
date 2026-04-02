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
  const { nodes, variables, subplots, items } = useEditorStore();
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

        if (key === 'not' || key === 'is_not' || key === 'has_not') {
          let labelTrue = 'NOT';
          let labelFalse = '(optionally NOT)';

          if (key === 'is_not') {
            labelTrue = 'is not';
            labelFalse = 'is';
          } else if (key === 'has_not') {
            labelTrue = 'has not';
            labelFalse = 'has';
          }

          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={() => handleToggleBoolean('not')}
            >
              {params.not ? labelTrue : labelFalse}
            </span>
          );
        }

        if (key === 'page' || key === 'pageId') {
          const selectedPageId = params[key] as string | null;
          const selectedNode = nodes.find((n: EditorNode) => n.id === selectedPageId);
          const label = selectedNode ? (selectedNode.data.title as string) || `Page ${selectedNode.id}` : 'Select a page...';

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

        if (key === 'targetPageId') {
          const selectedPageId = params['targetPageId'] as string | null;
          const selectedNode = nodes.find((n: EditorNode) => n.id === selectedPageId);
          const label = selectedNode ? (selectedNode.data.title as string) || `Page ${selectedNode.id}` : 'Select a page...';

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

        if (key === 'displayStyle') {
          const style = params.displayStyle as string;
          // default to styled if undefined
          const label = style === 'paragraph' ? 'a paragraph' : 'a styled notification';
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'displayStyle')}
            >
              {label}
            </span>
          );
        }

        if (key === 'itemId') {
          const selectedItemId = params.itemId as string | null;
          const selectedItem = selectedItemId ? items[selectedItemId] : null;
          const label = selectedItem ? selectedItem.name : 'Select item...';
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'itemId')}
            >
              {label}
            </span>
          );
        }

        if (key === 'count') {
          const selectedItemId = params.itemId as string | null;
          const selectedItem = selectedItemId ? items[selectedItemId] : null;
          if (selectedItem && !selectedItem.multiple) {
            return null;
          }
          const val = params.count as number;
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'count', String(val || 1))}
            >
              {val || 1}
            </span>
          );
        }

        if (key === 'comparison') {
          const val = (params.comparison as string) || 'equal';
          return (
            <span
              key={index}
              className={styles.interactiveToken}
              onClick={(e) => handleOpenPopover(e, 'comparison')}
            >
              {val}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const pageOptions = nodes.map((n: EditorNode) => ({ label: (n.data.title as string) || `Page ${n.id}`, value: n.id }));
  // When selecting a target page for a subplot, we might want to filter, but for now we'll show all pages or filter by the selected subplot
  const currentSelectedSubplotId = params['subplotId'] as string | null;
  const targetPageOptions = currentSelectedSubplotId
    ? nodes.filter(n => n.data.subplotId === currentSelectedSubplotId).map(n => ({ label: (n.data.title as string) || `Page ${n.id}`, value: n.id }))
    : pageOptions;

  const variableOptions = Object.keys(variables).map((k) => ({ label: k, value: k }));
  const subplotOptions = (subplots || []).map(s => ({ label: s.name, value: s.id }));
  const itemOptions = Object.entries(items || {}).map(([key, item]) => ({ label: item.name, value: key }));

  let warningText = null;
  if (params.itemId) {
    const itemDef = items[params.itemId as string];
    if (itemDef && !itemDef.multiple) {
      if (params.count && Number(params.count) > 1) {
        warningText = `Warning: "${itemDef.name}" is not a multiple item, so count > 1 will never be met or is invalid.`;
      }
    }
  }

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


      {warningText && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#b91c1c', background: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #f87171' }}>
          {warningText}
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

        {popoverState.tokenTarget === 'displayStyle' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Message format:</p>
            <Combobox
              options={[
                { label: 'Styled Notification', value: 'styled' },
                { label: 'Regular Paragraph', value: 'paragraph' }
              ]}
              autoFocus
              onSelect={(val) => {
                onChangeParam('displayStyle', val);
                handleClosePopover();
              }}
            />
          </div>
        )}

        {popoverState.tokenTarget === 'count' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Set count:</p>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <input
                type="number"
                min="1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onChangeParam('count', parseInt(inputValue, 10) || 1);
                    handleClosePopover();
                  }
                }}
                style={{ flex: 1, padding: '0.25rem', border: '1px solid #ccc', borderRadius: '3px' }}
              />
              <button
                onClick={() => {
                  onChangeParam('count', parseInt(inputValue, 10) || 1);
                  handleClosePopover();
                }}
                style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {popoverState.tokenTarget === 'comparison' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '160px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Set comparison:</p>
            <Combobox
              options={[
                { label: 'equal', value: 'equal' },
                { label: 'greater than', value: 'greater than' },
                { label: 'greater or equal', value: 'greater or equal' },
                { label: 'less or equal', value: 'less or equal' },
                { label: 'less than', value: 'less than' },
                { label: 'exactly', value: 'exactly' },
                { label: 'more than', value: 'more than' },
              ]}
              autoFocus
              onSelect={(val) => {
                onChangeParam('comparison', val);
                handleClosePopover();
              }}
            />
          </div>
        )}

        {popoverState.tokenTarget === 'itemId' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Select an item:</p>
            {itemOptions.length > 0 ? (
              <Combobox
                options={itemOptions}
                autoFocus
                onSelect={(val) => {
                  onChangeParam('itemId', val);
                  handleClosePopover();
                }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>No items defined yet.</p>
            )}
          </div>
        )}
      </Popover>
    </div>
  );
};
