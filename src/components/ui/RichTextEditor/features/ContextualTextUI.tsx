import React, { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { Button } from '../../Button/Button';
import { Input } from '../../Input/Input';
import { Popover } from '../../Popover/Popover';
import { RichTextEditor } from '../RichTextEditor';
import { BoldFeature } from './BoldFeature';
import { ItalicFeature } from './ItalicFeature';
import { InsertVariableFeature } from './InsertVariableFeature';
import type { ContextualTextFeature } from './ContextualTextFeature';
import styles from '../RichTextEditor.module.css';

const CONTEXT_EDITOR_FEATURES = [
  new BoldFeature(),
  new ItalicFeature(),
  new InsertVariableFeature(),
];

/**
 * A hidden component that mounts alongside the editor and listens for right-clicks
 * specifically on contextual-text marks to show a custom edit/remove menu.
 */
export const ContextualTextUI: React.FC<{ editor: Editor; feature: ContextualTextFeature }> = ({ editor, feature }) => {
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    title: string;
    pos: number | null;
  }>({ visible: false, x: 0, y: 0, text: '', title: '', pos: null });

  const [popoverState, setPopoverState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    title: string;
    isEdit: boolean;
    pos: number | null;
    range?: { from: number; to: number };
  } | null>(null);

  useEffect(() => {
    feature.setListener((action) => {
      if (action.type === 'open_popover') {
        setPopoverState({ visible: true, ...action.payload });
        setMenuState((prev) => ({ ...prev, visible: false })); // close context menu if open
      }
    });
    return () => feature.setListener(null);
  }, [feature]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target && target.classList.contains('contextual-text-mark')) {
        // Only the editor that contains this target should handle it
        if (!editor.view.dom.contains(target)) {
          setMenuState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
          return;
        }

        e.preventDefault();

        const coordsPos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });

        setMenuState({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          text: target.getAttribute('data-context') || '',
          title: target.getAttribute('data-title') || '',
          pos: coordsPos ? coordsPos.pos : null,
        });
      } else {
        setMenuState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [editor]);

  const handleEdit = () => {
    setPopoverState({
      visible: true,
      x: menuState.x,
      y: menuState.y,
      text: menuState.text,
      title: menuState.title,
      isEdit: true,
      pos: menuState.pos,
    });
    setMenuState((prev) => ({ ...prev, visible: false }));
  };

  const handleRemove = () => {
    if (menuState.pos !== null) {
      editor.chain()
        .focus()
        .setTextSelection(menuState.pos)
        .extendMarkRange('contextualText')
        .unsetContextualText()
        .run();
    }
    setMenuState((prev) => ({ ...prev, visible: false }));
  };

  const handleSavePopover = () => {
    if (popoverState) {
      if (popoverState.isEdit && popoverState.pos !== null) {
        editor.chain()
          .focus()
          .setTextSelection(popoverState.pos)
          .extendMarkRange('contextualText')
          .setContextualText({ context: popoverState.text, title: popoverState.title })
          .run();
      } else if (!popoverState.isEdit && popoverState.range) {
        editor.chain()
          .focus()
          .setTextSelection({ from: popoverState.range.from, to: popoverState.range.to })
          .setContextualText({ context: popoverState.text, title: popoverState.title })
          .run();
      }
    }
    setPopoverState(null);
  };

  return (
    <>
      <Popover
        isOpen={menuState.visible && menuState.pos !== null}
        onClose={() => setMenuState((prev) => ({ ...prev, visible: false }))}
        x={menuState.x}
        y={menuState.y}
        className={styles.contextMenu}
        data-popover="true"
      >
        <button className={styles.contextMenuItem} onClick={handleEdit}>
          Edit Context
        </button>
        <button className={styles.contextMenuItem} onClick={handleRemove}>
          Remove Context
        </button>
      </Popover>

      <Popover
        isOpen={!!popoverState?.visible}
        onClose={() => setPopoverState(null)}
        x={popoverState?.x || 0}
        y={(popoverState?.y || 0) + 10}
        className={styles.popoverInput}
        data-popover="true"
      >
        <h4 className={styles.popoverInputTitle}>
          {popoverState?.isEdit ? 'Edit Context' : 'Add Context'}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <Input
            placeholder="Title (optional)"
            value={popoverState?.title || ''}
            onChange={(e) =>
              popoverState && setPopoverState({ ...popoverState, title: e.target.value })
            }
          />
          <div className={styles.contextEditorWrapper}>
            <RichTextEditor
              content={popoverState?.text || ''}
              features={CONTEXT_EDITOR_FEATURES}
              onChange={(html) =>
                popoverState && setPopoverState({ ...popoverState, text: html })
              }
            />
          </div>
        </div>
        <div className={styles.popoverActions}>
          <Button variant="secondary" size="sm" onClick={() => setPopoverState(null)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSavePopover}>
            Save
          </Button>
        </div>
      </Popover>
    </>
  );
};
