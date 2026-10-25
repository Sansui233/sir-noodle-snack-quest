// Builds a release: only the files the game needs at runtime (no tools, docs, dev config).
//   node tools/release.mjs                      -> dist/sir-noodle/ (+ dist/sir-noodle-v<version>.zip if tar is available)
//   node tools/release.mjs --to <dir> [...]     -> also replaces <dir> with a copy of the release (one --to per target)
// The version is VERSION in src/config.js; tag the release commit as v<version> in git.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = ['index.html', 'css', 'src', 'assets'];      // everything index.html loads
const version = readFileSync(join(root, 'src/config.js'), 'utf8').match(/const VERSION = '([^']+)'/)[1];

const out = join(root, 'dist', 'sir-noodle');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const p of RUNTIME) cpSync(join(root, p), join(out, p), { recursive: true });
writeFileSync(join(out, 'VERSION'), version + '\n');
console.log(`built v${version} -> ${out}`);

try {
  const zip = join(root, 'dist', `sir-noodle-v${version}.zip`);
  rmSync(zip, { force: true });
  execFileSync('tar', ['-a', '-c', '-f', zip, '-C', join(root, 'dist'), 'sir-noodle']);
  console.log(`zipped -> ${zip}`);
} catch { console.log('(no zip: tar not available)'); }

// --to <dir>: replace the target folder with the release (old files there, e.g. a previous version, are removed)
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--to') continue;
  const dest = resolve(args[++i]);
  if (!existsSync(dirname(dest))) throw new Error(`parent folder does not exist: ${dirname(dest)}`);
  rmSync(dest, { recursive: true, force: true });
  cpSync(out, dest, { recursive: true });
  console.log(`copied -> ${dest}`);
}
