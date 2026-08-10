import React, { useRef, useState, useMemo } from 'react';
import { Variable as VariableIcon } from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { useEditorStore } from '../../../../features/editor/store/useEditorStore';
import { Button } from '../../Button/Button';
import { Popover } from '../../Popover/Popover';
import { Combobox } from '../../Combobox/Combobox';
import styles from '../RichTextEditor.module.css';

export const VariableToolbarButton: React.FC<{ editor: Editor }> = ({ editor }) => {
  /*
   * The anchor is measured when the button is pressed, not during render.
   * Reading a ref while rendering is both untrackable by React and the wrong
   * moment to measure — the layout it reports is the previous one.
   */
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const variables = useEditorStore((state) => state.variables);

  // Convert the record of variables into an array of options for the Combobox
  const options = useMemo(() => {
    return Object.keys(variables).map((key) => ({
      label: key,
      value: key,
    }));
  }, [variables]);

  const handleSelect = (value: string) => {
    // Insert the variable as a string with double brackets
    editor.chain().focus().insertContent(`{{${value}}}`).run();
    setAnchor(null);
  };

  const handleOpen = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    setAnchor({ x: rect?.left ?? 0, y: rect ? rect.bottom + 8 : 0 });
  };

  return (
    <>
      <Button
        ref={buttonRef}
        className={styles.toolbarBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleOpen}
        variant="secondary"
        size="sm"
        title="Insert Variable"
      >
        <VariableIcon size={16} />
      </Button>

      <Popover
        isOpen={anchor !== null}
        onClose={() => setAnchor(null)}
        x={anchor?.x ?? 0}
        y={anchor?.y ?? 0}
        data-popover="true"
      >
        <Combobox
          options={options}
          onSelect={handleSelect}
          placeholder="Search variable..."
          autoFocus
        />
      </Popover>
    </>
  );
};
