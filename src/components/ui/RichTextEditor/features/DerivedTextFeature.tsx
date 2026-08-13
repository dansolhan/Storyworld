import type { Editor } from '@tiptap/core';
import type { ReactNodeViewProps } from '@tiptap/react';
import { Shuffle } from 'lucide-react';
import { Button } from '../../Button/Button';
import { RTEFeature } from '../RTEFeature';
import { DerivedTextNode } from '../extensions/DerivedTextNode';
import styles from '../RichTextEditor.module.css';

export interface DerivedTextFeatureOptions {
  /** Renders the inline chip, supplied by the caller that knows the store. */
  renderChip: React.ComponentType<ReactNodeViewProps>;
  /**
   * Creates an empty derived text and returns its id.
   *
   * The feature inserts a token pointing at whatever it is handed; it does not know
   * where derived texts are kept.
   */
  createDerivedText: () => string;
}

export class DerivedTextFeature extends RTEFeature {
  private options: DerivedTextFeatureOptions;

  constructor(options: DerivedTextFeatureOptions) {
    super();
    this.options = options;
  }

  get name() {
    return 'derivedText';
  }

  getExtensions() {
    return [DerivedTextNode.configure({ renderChip: this.options.renderChip })];
  }

  renderToolbarButton(editor: Editor) {
    return (
      <Button
        key={this.name}
        className={styles.toolbarBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertDerivedText({ derivedId: this.options.createDerivedText() })
            .run()
        }
        variant="secondary"
        size="sm"
        title="Derived text — says something different depending on the story"
      >
        <Shuffle size={16} />
      </Button>
    );
  }
}
