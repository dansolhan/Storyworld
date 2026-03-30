import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './RichTextEditor.module.css';
import type { RTEFeature } from './RTEFeature';

export interface RichTextEditorProps {
  content: string;
  features: RTEFeature[];
  onChange: (html: string) => void;
  hideToolbarUntilHover?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  features, 
  onChange,
  hideToolbarUntilHover = false
}) => {
  // Extract all extensions dynamically from the provided features array
  const extensions = useMemo(() => {
    const featureExts = features.flatMap((feature) => feature.getExtensions());
    // StarterKit is our base, plus whatever features we inject
    return [StarterKit, ...featureExts];
  }, [features]);

  const editor = useEditor({
    extensions,
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
    <div className={`${styles.editorContainer} ${hideToolbarUntilHover ? styles.hideToolbarUntilHover : ''}`}>
      <div className={styles.toolbar}>
        {features.map((feature) => {
          const btn = feature.renderToolbarButton(editor);
          if (!btn) return null;
          return (
            <React.Fragment key={feature.name}>
              {btn}
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.contentWrapper}>
        <EditorContent editor={editor} className={styles.editorContent} />

        {/* Render any supplementary UI layers from the features (like the context menu) */}
        {features.map((feature) => feature.renderUI(editor))}
      </div>
    </div>
  );
};
