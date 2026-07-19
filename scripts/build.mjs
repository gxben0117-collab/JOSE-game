import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd(), dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
mkdirSync(dist, { recursive: true });
for (const name of ['index.html', 'tactics.html', 'css', 'js', 'assets']) {
  const from = join(root, name);
  if (!existsSync(from)) throw new Error(`Build input missing: ${name}`);
  cpSync(from, join(dist, name), {
    recursive: true,
    // 只帶執行期資產：排除美術原始檔（合圖來源）、切圖工作檔與預覽圖。
    // Individual PNG frames and source/reference art stay available to artists;
    // the production site only loads the atlas files used at runtime.
    filter: source => !/evolution-sheet|-source\.png$|_preview|[\\/]sprites([\\/]|$)|[\\/]animations[\\/]directional[\\/](?:frames|sources|views)([\\/]|$)/.test(source)
  });
}
console.log('Build completed: static site copied to dist/.');
