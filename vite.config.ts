/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['src/**/*.stories.*', 'src/test/setup.ts', 'node_modules/**'],
    server: {
      deps: {
        inline: [
          '@asamuzakjp/css-color',
          '@csstools/css-calc'
        ]
      }
    }
  }
});