import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
import {
  DERIVED_ID_ATTR,
  DERIVED_TOKEN_CLASS,
} from '../../../../domain/DerivedText/derivedToken';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    derivedText: {
      insertDerivedText: (attributes: { derivedId: string }) => ReturnType;
    };
  }
}

export interface DerivedTextNodeOptions {
  /**
   * Renders the chip. Injected rather than imported, because showing the outcomes
   * needs the story's derived texts and this is generic UI — see
   * `ContextualTextFeature` for the same reasoning.
   */
  renderChip?: React.ComponentType<ReactNodeViewProps>;
}

/**
 * A derived text in the prose.
 *
 * An inline **atom**: it holds no words of its own, because what it says depends on
 * story state and is resolved at render. A mark could not model that — a mark wraps
 * text that already exists.
 */
export const DerivedTextNode = Node.create<DerivedTextNodeOptions>({
  name: 'derivedText',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {};
  },

  addAttributes() {
    return {
      derivedId: {
        default: null,
        parseHTML: (element) => element.getAttribute(DERIVED_ID_ATTR),
        renderHTML: (attributes) =>
          attributes.derivedId ? { [DERIVED_ID_ATTR]: attributes.derivedId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: `span[${DERIVED_ID_ATTR}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    /*
     * Serialised empty. The player replaces the whole element with the resolved
     * text, so anything written inside it would be discarded — and would be a
     * second copy of something that lives in the collection.
     */
    return ['span', mergeAttributes({ class: DERIVED_TOKEN_CLASS }, HTMLAttributes)];
  },

  addNodeView() {
    /* No chip supplied means no node view: the plain serialised span is rendered. */
    const chip = this.options.renderChip;
    return chip ? ReactNodeViewRenderer(chip) : null;
  },

  addCommands() {
    return {
      insertDerivedText:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: attributes }),
    };
  },
});
