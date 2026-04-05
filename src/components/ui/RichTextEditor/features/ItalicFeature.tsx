import { Italic as ItalicIcon } from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { RTEFeature } from '../RTEFeature';
import { Button } from '../../Button/Button';
import styles from '../RichTextEditor.module.css';

export class ItalicFeature extends RTEFeature {
  get name() {
    return 'italic';
  }

  getExtensions() {
    // Included in StarterKit
    return [];
  }

  renderToolbarButton(editor: Editor) {
    return (
      <Button
        key={this.name}
        className={styles.toolbarBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive('italic') ? 'primary' : 'secondary'}
        size="sm"
        title="Italic"
      >
        <ItalicIcon size={16} />
      </Button>
    );
  }
}
