import type { Preview } from '@storybook/react-vite'
import '../src/styles/theme.css';

const preview: Preview = {
  parameters: {
    /*
     * The app is dark-only, so there is one background and it is the app's own
     * canvas ground. A light option here would render components against a
     * surface that does not exist in the product.
     */
    backgrounds: {
      options: {
        canvas: { name: 'Canvas', value: '#141311' },
        panel: { name: 'Panel', value: '#1a1816' },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;