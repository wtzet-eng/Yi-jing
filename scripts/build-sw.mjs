import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(path) : path;
  }))).flat();
}
const paths = (await files('dist')).filter(p => !p.endsWith('/sw.js')).sort();
const template = await readFile('public/sw.js', 'utf8');
const hash = createHash('sha256').update(template);
for (const path of paths) hash.update(path).update(await readFile(path));
const version = hash.digest('hex').slice(0, 16);
const assets = paths.map(p => `/${p.slice(5)}`);
await writeFile('dist/sw.js', template
  .replace('"__BUILD_VERSION__"', JSON.stringify(version))
  .replace('["__PRECACHE_ASSETS__"]', JSON.stringify(assets)));
console.log(`Offline build ${version}: ${assets.length} files`);
