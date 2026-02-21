import React, { useState } from 'react';
import type { Conditional, ConditionalBlueprint } from '../../../../domain/Conditionals/Conditional';
import { useEditorStore } from '../../store/useEditorStore';
import type { EditorNode } from '../../store/editorTypes';
import { Popover } from '../../../../components/ui/Popover/Popover';
import { Combobox } from '../../../../components/ui/Combobox/Combobox';
import styles from './ConditionalsEditor.module.css';

interface ConditionalCardProps {
  pageId: string;
  choiceId: string;
  conditional: Conditional;
  blueprint: ConditionalBlueprint<any>;
}

export const ConditionalCard: React.FC<ConditionalCardProps> = ({ pageId, choiceId, conditional, blueprint }) => {
  const { updateChoiceConditional, removeChoiceConditional, nodes } = useEditorStore();
  const [popoverState, setPopoverState] = useState<{ isOpen: boolean; x: number; y: number; tokenTarget: string }>({
    isOpen: false,
    x: 0,
    y: 0,
    tokenTarget: '',
  });

  const handleToggleBoolean = (key: string) => {
    updateChoiceConditional(pageId, choiceId, conditional.id, {
      ...conditional.params,
      [key]: !conditional.params[key],
    });
  };

  const handleOpenPopover = (e: React.MouseEvent, tokenKey: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverState({
      isOpen: true,
      x: rect.left,
      y: rect.bottom + 5,
      tokenTarget: tokenKey,
    });
  };

  const renderTemplate = () => {
    // splits "The player has {{not}} visited {{page}}" into ["The player has ", "{{not}}", " visited ", "{{page}}", ""]
    const parts = blueprint.template.split(/({{\w+}})/g);

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
              {conditional.params.not ? 'NOT' : '(optionally NOT)'}
            </span>
          );
        }

        if (key === 'page') {
          const selectedPageId = conditional.params.pageId as string | null;
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

        return <span key={index}>{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const pageOptions = nodes.map((n: EditorNode) => ({ label: n.data.title || `Page ${n.id}`, value: n.id }));

  return (
    <div className={styles.card}>
      <div className={styles.cardText}>
        {renderTemplate()}
      </div>
      <button
        className={styles.deleteBtn}
        onClick={() => removeChoiceConditional(pageId, choiceId, conditional.id)}
        title="Remove Conditional"
      >
        &times;
      </button>

      <Popover
        isOpen={popoverState.isOpen}
        x={popoverState.x}
        y={popoverState.y}
        onClose={() => setPopoverState((prev) => ({ ...prev, isOpen: false }))}
      >
        {popoverState.tokenTarget === 'pageId' && (
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600 }}>Select a page:</p>
            <Combobox
              options={pageOptions}
              autoFocus
              onSelect={(val) => {
                updateChoiceConditional(pageId, choiceId, conditional.id, {
                  ...conditional.params,
                  pageId: val
                });
                setPopoverState((prev) => ({ ...prev, isOpen: false }));
              }}
            />
          </div>
        )}
      </Popover>
    </div>
  );
};
