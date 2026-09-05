import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithOxc } from 'vite';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const roots = ['src', 'tests', 'scripts'];
const topLevelFiles = ['vite.config.js', 'vitest.setup.js'];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path));
    } else if (['.js', '.jsx'].includes(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

async function main() {
  const files = [
    ...topLevelFiles.map((file) => resolve(repositoryRoot, file)),
    ...(await Promise.all(roots.map((root) => collectFiles(resolve(repositoryRoot, root))))).flat(),
  ];

  const failures = [];
  for (const file of files) {
    try {
      await transformWithOxc(await readFile(file, 'utf8'), file, {
        lang: extname(file) === '.jsx' ? 'jsx' : 'js',
        target: 'es2022',
        jsx: { runtime: 'automatic' },
      });
    } catch (error) {
      failures.push(`${relative(repositoryRoot, file)}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`JavaScript validation failed:\n${failures.join('\n')}`);
  }

  console.log(`Validated ${files.length} JavaScript/JSX files.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
