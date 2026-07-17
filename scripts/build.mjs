import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd(), dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const name of ['index.html', 'tactics.html', 'css', 'js', 'assets']) {
  const from = join(root, name);
  if (!existsSync(from)) throw new Error(`Build input missing: ${name}`);
  cpSync(from, join(dist, name), {
    recursive: true,
    // 只帶執行期資產：排除美術原始檔（合圖來源）、切圖工作檔與預覽圖。
    filter: source => !/evolution-sheet|-source\.png$|_preview|[\\/]sprites([\\/]|$)/.test(source)
  });
}
console.log('Build completed: static site copied to dist/.');
