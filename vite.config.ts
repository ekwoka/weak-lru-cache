/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    includeSource: ['*.{spec,test}.{ts,tsx}'],
    coverage: {
      reporter: ['text-summary', 'text']
    },
    deps: {}
  }
});
