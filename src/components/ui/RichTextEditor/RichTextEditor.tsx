import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './RichTextEditor.module.css';
import { Button } from '../Button/Button';

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // A tiny hack: if `content` is updated from outside, sync the editor. Better than keys causing re-mounts.
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <Button
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive('bold') ? 'primary' : 'secondary'}
          size="sm"
        >
          B
        </Button>
        <Button
          className={styles.toolbarBtn}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive('italic') ? 'primary' : 'secondary'}
          size="sm"
        >
          I
        </Button>
      </div>
      <EditorContent editor={editor} className={styles.editorContent} />
    </div>
  );
};
