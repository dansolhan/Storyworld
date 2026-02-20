import type { Editor } from '@tiptap/core';
import type { Extension, Mark, Node } from '@tiptap/core';
import type { ReactNode } from 'react';

/**
 * Abstract class representing a pluggable feature for the Rich Text Editor.
 * This class allows us to encapsulate the extensions, toolbar buttons, and 
 * supplementary UI components (like modals or context menus) for isolated editing features.
 */
export abstract class RTEFeature {
  /**
   * Internal name/identifier for this feature.
   */
  abstract get name(): string;

  /**
   * Returns an array of TipTap extensions, marks, or nodes to inject into the editor.
   */
  abstract getExtensions(): (Extension<any, any> | Mark<any, any> | Node<any, any>)[];

  /**
   * Renders the toolbar button for this feature. 
   * Return null if the feature doesn't require a toolbar button.
   */
  abstract renderToolbarButton(editor: Editor): ReactNode | null;

  /**
   * Optional: Renders any additional UI that must sit inside the editor container.
   * Useful for modals, context menus, or floating toolbars tied to this specific feature.
   */
  renderUI(_editor: Editor): ReactNode | null {
    return null;
  }
}
