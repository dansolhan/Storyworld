import React, { useState, useRef, useMemo } from 'react';
import { Variable as VariableIcon } from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { useEditorStore } from '../../../../features/editor/store/useEditorStore';
import { RTEFeature } from '../RTEFeature';
import { Button } from '../../Button/Button';
import { Popover } from '../../Popover/Popover';
import { Combobox } from '../../Combobox/Combobox';
import styles from '../RichTextEditor.module.css';

const VariableToolbarButton: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  };

  // Calculate position for popover
  const rect = buttonRef.current?.getBoundingClientRect();
  const x = rect ? rect.left : 0;
  const y = rect ? rect.bottom + 8 : 0;

  return (
    <>
      <Button
        ref={buttonRef}
        className={styles.toolbarBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        title="Insert Variable"
      >
        <VariableIcon size={16} />
      </Button>

      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} x={x} y={y} data-popover="true">
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

export class InsertVariableFeature extends RTEFeature {
  get name() {
    return 'insertVariable';
  }

  getExtensions() {
    return [];
  }

  renderToolbarButton(editor: Editor) {
    return <VariableToolbarButton key={this.name} editor={editor} />;
  }
}
