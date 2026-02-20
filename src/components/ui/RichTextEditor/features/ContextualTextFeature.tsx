import React, { useState, useEffect } from 'react';
import { MessageSquareText } from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { RTEFeature } from '../RTEFeature';
import { ContextualText } from '../extensions/ContextualText';
import { Button } from '../../Button/Button';
import styles from '../RichTextEditor.module.css';

export class ContextualTextFeature extends RTEFeature {
  get name() {
    return 'contextualText';
  }

  getExtensions() {
    return [ContextualText];
  }

  renderToolbarButton(editor: Editor) {
    const isActive = editor.isActive(this.name);

    const handleToggle = () => {
      if (isActive) {
        editor.chain().focus().unsetContextualText().run();
        return;
      }

      const context = window.prompt('Enter the contextual information:');
      if (context) {
        editor.chain().focus().setContextualText({ context }).run();
      }
    };

    return (
      <Button
        key={this.name}
        className={styles.toolbarBtn}
        onClick={handleToggle}
        variant={isActive ? 'primary' : 'secondary'}
        size="sm"
        title="Add Contextual Text"
      >
        <MessageSquareText size={16} />
      </Button>
    );
  }

  renderUI(editor: Editor) {
    // Return a React component that manages the context menu state for this feature.
    return <ContextualTextContextMenu key="context-menu" editor={editor} />;
  }
}

/**
 * A hidden component that mounts alongside the editor and listens for right-clicks
 * specifically on contextual-text marks to show a custom edit/remove menu.
 */
const ContextualTextContextMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    pos: number | null; // The document position of the mark
  }>({ visible: false, x: 0, y: 0, text: '', pos: null });

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // If they click elsewhere or in a different editor, close the menu
      if (!editor.view.dom.contains(target)) {
        setMenuState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Check if we right-clicked on our specific mark
      if (target.classList.contains('contextual-text-mark')) {
        e.preventDefault(); // Prevent standard browser right-click menu

        // Try to get pos via coords, fallback to posAtDOM (more reliable for inline marks)
        let resolvedPos: number | null = null;
        const coordsPos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });

        if (coordsPos) {
          resolvedPos = coordsPos.pos;
        } else {
          // Fallback
          resolvedPos = editor.view.posAtDOM(target, 0);
        }

        setMenuState({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          text: target.getAttribute('data-context') || '',
          pos: resolvedPos,
        });
      } else {
        // Clicked inside this editor but not on a mark
        setMenuState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const handleClickOutside = () => {
      setMenuState((prev) => prev.visible ? { ...prev, visible: false } : prev);
    };

    // Attach to document to catch all events
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor]);

  if (!menuState.visible || menuState.pos === null) return null;

  const handleEdit = () => {
    const newContext = window.prompt('Edit contextual information:', menuState.text);
    if (newContext !== null) {
      // Set cursor inside the mark, select the whole mark, then update it
      editor.chain()
        .focus()
        .setTextSelection(menuState.pos!)
        .extendMarkRange('contextualText')
        .setContextualText({ context: newContext })
        .run();
    }
    setMenuState((prev) => ({ ...prev, visible: false }));
  };

  const handleRemove = () => {
    // Set cursor inside the mark, select the whole mark, then remove it
    editor.chain()
      .focus()
      .setTextSelection(menuState.pos!)
      .extendMarkRange('contextualText')
      .unsetContextualText()
      .run();
    setMenuState((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div
      className={styles.contextMenu}
      style={{ top: menuState.y, left: menuState.x }}
      onClick={(e) => e.stopPropagation()} // Prevent click from bubbling and closing immediately
    >
      <button className={styles.contextMenuItem} onClick={handleEdit}>
        Edit Context
      </button>
      <button className={styles.contextMenuItem} onClick={handleRemove}>
        Remove Context
      </button>
    </div>
  );
};
