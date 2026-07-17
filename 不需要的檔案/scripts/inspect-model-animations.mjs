import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('assets/models/pets');
for (const name of fs.readdirSync(dir).filter((x) => x.endsWith('.glb')).sort()) {
  const data = fs.readFileSync(path.join(dir, name));
  if (data.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${name}: invalid GLB`);
  let offset = 12;
  let json = null;
  while (offset < data.length) {
    const length = data.readUInt32LE(offset);
    const type = data.readUInt32LE(offset + 4);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8', offset + 8, offset + 8 + length).trim());
    offset += 8 + length;
  }
  const clips = (json?.animations || []).map((x, i) => x.name || `clip-${i}`);
  console.log(`${name}\t${clips.join('|')}`);
}
