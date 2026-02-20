import { Bold as BoldIcon } from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { RTEFeature } from '../RTEFeature';
import { Button } from '../../Button/Button';
import styles from '../RichTextEditor.module.css';

export class BoldFeature extends RTEFeature {
  get name() {
    return 'bold';
  }

  getExtensions() {
    // StarterKit includes Bold natively, but we can't extract it easily without adding another extension.
    // StarterKit automatically includes Bold, but to fit the architecture correctly, 
    // it's returned as part of the StarterKit array in our main editor init.
    // If we wanted pure isolation, we'd import `Bold` from `@tiptap/extension-bold`.
    return [];
  }

  renderToolbarButton(editor: Editor) {
    return (
      <Button
        key={this.name}
        className={styles.toolbarBtn}
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive('bold') ? 'primary' : 'secondary'}
        size="sm"
        title="Bold"
      >
        <BoldIcon size={16} />
      </Button>
    );
  }
}
