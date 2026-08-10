import { MessageSquareText } from 'lucide-react';
import { Button } from '../../Button/Button';
import type { Editor } from '@tiptap/core';
import { RTEFeature } from '../RTEFeature';
import { ContextualText } from '../extensions/ContextualText';
import { ContextualTextUI } from './ContextualTextUI';
import styles from '../RichTextEditor.module.css';



/**
 * What the toolbar button asks the mounted UI to do. Typing this surfaced a
 * missing `title` in the payload below: the popover state declares it as a
 * string, and the untyped dispatch was leaving it undefined.
 */
export interface ContextualTextOpenPopoverAction {
  type: 'open_popover';
  payload: {
    x: number;
    y: number;
    text: string;
    title: string;
    pos: number;
    isEdit: boolean;
    range: { from: number; to: number };
  };
}

export type ContextualTextAction = ContextualTextOpenPopoverAction;
export type ContextualTextListener = (action: ContextualTextAction) => void;

export class ContextualTextFeature extends RTEFeature {
  private listener: ContextualTextListener | null = null;

  public setListener(fn: ContextualTextListener | null) { this.listener = fn; }

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

      const { from, to } = editor.state.selection;
      let coords;
      try {
        coords = editor.view.coordsAtPos(from);
      } catch {
        const rect = editor.view.dom.getBoundingClientRect();
        coords = { left: rect.left, bottom: rect.top + 30 };
      }

      this.listener?.({
        type: 'open_popover',
        payload: { x: coords.left, y: coords.bottom, text: '', title: '', pos: from, isEdit: false, range: { from, to } }
      });
    };

    return (
      <Button
        key={this.name}
        className={styles.toolbarBtn}
        onMouseDown={(e) => e.preventDefault()}
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
    // Return a React component that manages the context menu and input popover state.
    return <ContextualTextUI key="contextual-text-ui" editor={editor} feature={this} />;
  }
}
