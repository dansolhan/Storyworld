import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import type { EditorNode } from '../../store/editorTypes';
import { Popover } from '../../../../components/ui/Popover/Popover';
import { Combobox } from '../../../../components/ui/Combobox/Combobox';
import styles from './BlueprintRenderer.module.css';

interface BlueprintRendererProps {
  template: string;
  params: Record<string, unknown>;
  onChangeParam: (key: string, value: unknown) => void;
}

export const BlueprintRenderer: React.FC<BlueprintRendererProps> = ({
  template,
  params,
  onChangeParam,
}) => {
  const { nodes, variables, subplots, items } = useEditorStore();
  const [popoverState, setPopoverState] = useState<{ isOpen: boolean; x: number; y: number; tokenTarget: string }>({
    isOpen: false,
    x: 0,
    y: 0,
    tokenTarget: '',
  });

  const [inputValue, setInputValue] = useState('');

  const handleToggleBoolean = (key: string) => {
    onChangeParam(key, !params[key]);
  };

  const handleOpenPopover = (e: React.MouseEvent, tokenKey: string, initialValue?: string) => {
    e.stopPropagation(); // prevent tree node drag or selection
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
    // If no template is provided, just return empty
    if (!template) return null;
    
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
              onClick={(e) => { e.stopPropagation(); handleToggleBoolean('not'); }}
            >
              {params.not ? labelTrue : labelFalse}
            </span>
          );
        }

        if (key === 'page' || key === 'pageId') {
          const selectedPageId = params[key] as string | null;
          const selectedNode = nodes?.find((n: EditorNode) => n.id === selectedPageId);
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
          const selectedNode = nodes?.find((n: EditorNode) => n.id === selectedPageId);
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
          const selectedItem = selectedItemId && items ? items[selectedItemId] : null;
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
          const selectedItem = selectedItemId && items ? items[selectedItemId] : null;
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

  const pageOptions = (nodes || []).map((n: EditorNode) => ({ label: (n.data.title as string) || `Page ${n.id}`, value: n.id }));
  const currentSelectedSubplotId = params['subplotId'] as string | null;
  const targetPageOptions = currentSelectedSubplotId
    ? (nodes || []).filter(n => n.data.subplotId === currentSelectedSubplotId).map(n => ({ label: (n.data.title as string) || `Page ${n.id}`, value: n.id }))
    : pageOptions;

  const variableOptions = Object.keys(variables || {}).map((k) => ({ label: k, value: k }));
  const subplotOptions = (subplots || []).map(s => ({ label: s.name, value: s.id }));
  const itemOptions = Object.entries(items || {}).map(([key, item]) => ({ label: item.name, value: key }));

  return (
    <>
      <span className={styles.container}>
        {renderTemplate()}
      </span>

      <Popover
        isOpen={popoverState.isOpen}
        x={popoverState.x}
        y={popoverState.y}
        onClose={handleClosePopover}
      >
        {popoverState.tokenTarget === 'pageId' && (
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Select a page:</p>
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
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Select a target page:</p>
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
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Select a subplot:</p>
            <Combobox
              options={subplotOptions}
              autoFocus
              onSelect={(val) => {
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
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Select a variable:</p>
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
              <p className={styles.popoverEmpty}>No variables defined yet.</p>
            )}
          </div>
        )}

        {popoverState.tokenTarget === 'value' && (
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Set value:</p>
            <div className={styles.inputGroup}>
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
                className={styles.popoverInput}
              />
              <button
                onClick={() => {
                  onChangeParam('value', inputValue);
                  handleClosePopover();
                }}
                className={styles.popoverButton}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {popoverState.tokenTarget === 'message' && (
          <div className={styles.popoverContent} style={{ minWidth: 240 }}>
            <p className={styles.popoverTitle}>Post message text:</p>
            <div className={styles.inputGroup}>
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
                className={styles.popoverInput}
              />
              <button
                onClick={() => {
                  onChangeParam('message', inputValue);
                  handleClosePopover();
                }}
                className={styles.popoverButton}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {popoverState.tokenTarget === 'displayStyle' && (
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Message format:</p>
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
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Set count:</p>
            <div className={styles.inputGroup}>
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
                className={styles.popoverInput}
              />
              <button
                onClick={() => {
                  onChangeParam('count', parseInt(inputValue, 10) || 1);
                  handleClosePopover();
                }}
                className={styles.popoverButton}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {popoverState.tokenTarget === 'comparison' && (
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Set comparison:</p>
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
          <div className={styles.popoverContent}>
            <p className={styles.popoverTitle}>Select an item:</p>
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
              <p className={styles.popoverEmpty}>No items defined yet.</p>
            )}
          </div>
        )}
      </Popover>
    </>
  );
};
