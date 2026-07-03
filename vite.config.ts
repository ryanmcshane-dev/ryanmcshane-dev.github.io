import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  // Served at the root of ryanmcshane-dev.github.io — keep base '/'.
  base: '/',
  plugins: [{ enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) }, react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Pipeline tests live in tools/ (Node code), UI/content tests in src/.
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tools/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'tools/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'tools/**/*.test.ts',
        'tools/**/__fixtures__/**',
      ],
    },
  },
});
