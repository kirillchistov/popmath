import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'content');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(ROOT);
let failed = 0;
for (const file of files) {
  const raw = await readFile(file, 'utf8');
  try {
    JSON.parse(raw);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${path.relative(process.cwd(), file)}: ${message}`);
  }
}

if (failed > 0) {
  console.error(`JSON-контент: ${failed} файл(ов) с ошибкой.`);
  process.exit(1);
}

console.log(`JSON-контент: ${files.length} файл(ов) ок.`);
