// GitHub Pages serves static files only. For client-side routing to survive a
// hard refresh / deep link, copy the built index.html to 404.html so GH Pages'
// not-found fallback returns the SPA shell and React Router takes over.
import { copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'dist', 'index.html');
const dest = resolve(root, 'dist', '404.html');

try {
  await access(source, constants.F_OK);
  await copyFile(source, dest);
  console.log('[postbuild] Copied dist/index.html -> dist/404.html (SPA fallback)');
} catch (err) {
  console.error('[postbuild] Failed to create 404.html:', err.message);
  process.exit(1);
}
