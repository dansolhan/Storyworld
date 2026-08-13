import { Mark, mergeAttributes } from '@tiptap/core';

export interface ContextualTextOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contextualText: {
      setContextualText: (attributes: { contextId: string }) => ReturnType;
      toggleContextualText: (attributes: { contextId: string }) => ReturnType;
      unsetContextualText: () => ReturnType;
    };
  }
}

export const ContextualText = Mark.create<ContextualTextOptions>({
  name: 'contextualText',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'contextual-text-mark',
      },
    };
  },

  /*
   * The mark carries a reference, not a copy. Before schema 1.3.0 it held the note
   * itself in `data-context`, which is why the same note on three pages was three
   * unrelated copies — editing one changed nothing else.
   */
  addAttributes() {
    return {
      contextId: {
        default: null,
        parseHTML: element => element.getAttribute('data-context-id'),
        renderHTML: attributes => {
          if (!attributes.contextId) {
            return {};
          }
          return {
            'data-context-id': attributes.contextId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-context-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setContextualText: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleContextualText: attributes => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetContextualText: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
