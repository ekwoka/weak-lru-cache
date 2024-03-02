/// <reference types="vitest" />

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts()],
  build: {
    target: 'esnext',
    lib: {
      entry: './src/index.ts',
      fileName: 'index',
      formats: ['es'],
    },
    minify: false,
  },
  test: {
    globals: true,
    includeSource: ['*.{spec,test}.{ts,tsx}'],
    coverage: {
      reporter: ['text-summary', 'text', 'html'],
    },
    deps: {},
  },
});
