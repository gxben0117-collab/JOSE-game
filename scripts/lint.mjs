import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const ignored = new Set(['vendor', 'dist', 'node_modules', '.git']);
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return ignored.has(entry.name) ? [] : files(file);
    return /\.(?:js|mjs)$/.test(entry.name) ? [file] : [];
  });
}
const sources = files(join(root, 'js')).concat(files(join(root, 'scripts')));
let failed = 0;
for (const file of sources) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) { failed++; process.stderr.write(`${relative(root, file)}\n${result.stderr}`); }
}
for (const html of ['index.html', 'index-3d-legacy.html', 'adventure.html', 'tactics.html', 'showcase.html']) {
  const content = readFileSync(join(root, html), 'utf8');
  for (const match of content.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^\"]*)?"/g)) {
    const target = join(root, match[1]);
    if (!statSync(target, { throwIfNoEntry: false })) { failed++; console.error(`${html}: missing ${match[1]}`); }
  }
}
if (failed) process.exitCode = 1;
else console.log(`Lint passed: ${sources.length} JavaScript files parsed and entry assets verified.`);
