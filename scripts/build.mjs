import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd(), dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const name of ['index.html', 'index-3d-legacy.html', 'adventure.html', 'tactics.html', 'showcase.html', 'css', 'js', 'assets']) {
  const from = join(root, name);
  if (!existsSync(from)) throw new Error(`Build input missing: ${name}`);
  cpSync(from, join(dist, name), { recursive: true });
}
console.log('Build completed: static site copied to dist/.');
