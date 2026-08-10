import { Mark, mergeAttributes } from '@tiptap/core';

export interface ContextualTextOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contextualText: {
      setContextualText: (attributes: { context: string; title?: string }) => ReturnType;
      toggleContextualText: (attributes: { context: string; title?: string }) => ReturnType;
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

  addAttributes() {
    return {
      context: {
        default: null,
        parseHTML: element => element.getAttribute('data-context'),
        renderHTML: attributes => {
          if (!attributes.context) {
            return {};
          }
          return {
            'data-context': attributes.context,
          };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) {
            return {};
          }
          return {
            'data-title': attributes.title,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-context]',
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
