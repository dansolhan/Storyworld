import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { Button } from '../../Button/Button';
import type { Editor } from '@tiptap/core';
import { RTEFeature } from '../RTEFeature';
import { ContextualText } from '../extensions/ContextualText';
import { ContextualTextHost } from './ContextualTextHost';
import styles from '../RichTextEditor.module.css';

/**
 * The author has asked to attach a contextual entry to a range of prose.
 *
 * `entryId` is set when the range already carries a mark, so the picker can open
 * on the entry it is currently attached to.
 */
export interface ContextualTextRequest {
  x: number;
  y: number;
  /** The marked words, which a new entry is named after. */
  phrase: string;
  entryId: string | null;
  range: { from: number; to: number };
}

export interface ContextualTextPickerProps {
  request: ContextualTextRequest;
  /** Attaches the chosen entry to the range the request names. */
  onAttach: (entryId: string) => void;
  onCancel: () => void;
}

export interface ContextualTextFeatureOptions {
  /**
   * Renders the picker. Supplied by the caller rather than imported here, because
   * choosing an entry needs the story's entries and this is generic UI — a
   * `useEditorStore` import in `components/ui` would tie every consumer of the
   * rich-text editor to the editor feature.
   */
  renderPicker?: (props: ContextualTextPickerProps) => React.ReactNode;
}

export class ContextualTextFeature extends RTEFeature {
  private request: ContextualTextRequest | null = null;
  private notify: (() => void) | null = null;
  /* An explicit field, not a parameter property: `erasableSyntaxOnly` forbids those. */
  private options: ContextualTextFeatureOptions;

  constructor(options: ContextualTextFeatureOptions = {}) {
    super();
    this.options = options;
  }

  get name() {
    return 'contextualText';
  }

  getExtensions() {
    return [ContextualText];
  }

  /** Lets the mounted UI re-render when a request opens or closes. */
  public subscribe(notify: (() => void) | null) {
    this.notify = notify;
  }

  public get openRequest(): ContextualTextRequest | null {
    return this.request;
  }

  public closeRequest() {
    this.request = null;
    this.notify?.();
  }

  public attach(editor: Editor, entryId: string) {
    const request = this.request;
    this.request = null;
    if (!request) return;

    editor
      .chain()
      .focus()
      .setTextSelection(request.range)
      .setContextualText({ contextId: entryId })
      .run();
    this.notify?.();
  }

  renderToolbarButton(editor: Editor) {
    const isActive = editor.isActive(this.name);

    const handleToggle = () => {
      if (isActive) {
        editor.chain().focus().unsetContextualText().run();
        return;
      }

      const { from, to } = editor.state.selection;
      if (from === to) return; // Nothing selected: there is no phrase to mark.

      let coords;
      try {
        coords = editor.view.coordsAtPos(from);
      } catch {
        const rect = editor.view.dom.getBoundingClientRect();
        coords = { left: rect.left, bottom: rect.top + 30 };
      }

      this.request = {
        x: coords.left,
        y: coords.bottom,
        phrase: editor.state.doc.textBetween(from, to),
        entryId: (editor.getAttributes(this.name).contextId as string | null) ?? null,
        range: { from, to },
      };
      this.notify?.();
    };

    return (
      <Button
        key={this.name}
        className={styles.toolbarBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleToggle}
        variant={isActive ? 'primary' : 'secondary'}
        size="sm"
        title={isActive ? 'Remove contextual text' : 'Contextual text'}
      >
        <MessageSquareText size={16} />
      </Button>
    );
  }

  renderUI(editor: Editor) {
    const render = this.options.renderPicker;
    if (!render) return null;

    return (
      <ContextualTextHost key="contextual-text-host" editor={editor} feature={this} render={render} />
    );
  }
}
