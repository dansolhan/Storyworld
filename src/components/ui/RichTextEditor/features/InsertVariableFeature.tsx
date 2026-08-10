import type { Editor } from '@tiptap/core';
import { RTEFeature } from '../RTEFeature';
import { VariableToolbarButton } from './VariableToolbarButton';

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
