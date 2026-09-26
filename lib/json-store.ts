import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const LOCAL_DIR = path.join(process.cwd(), 'data');
const TMP_DIR = path.join('/tmp', 'mateshka-data');

let resolvedDir: string | null = null;

async function canWrite(dir: string): Promise<boolean> {
  const probe = path.join(dir, `.write-${process.pid}`);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(probe, 'ok');
    await unlink(probe);
    return true;
  } catch {
    try {
      await unlink(probe);
    } catch {
      /* probe may never have been created */
    }
    return false;
  }
}

export async function dataDir(): Promise<string> {
  if (resolvedDir) return resolvedDir;
  const fromEnv = process.env.DATA_DIR?.trim();
  if (fromEnv) {
    await mkdir(fromEnv, { recursive: true });
    resolvedDir = fromEnv;
    return resolvedDir;
  }
  if (await canWrite(LOCAL_DIR)) {
    resolvedDir = LOCAL_DIR;
    return resolvedDir;
  }
  await mkdir(TMP_DIR, { recursive: true });
  resolvedDir = TMP_DIR;
  return resolvedDir;
}

async function filePath(name: string): Promise<string> {
  return path.join(await dataDir(), name);
}

export async function readJsonArray<T>(name: string): Promise<T[]> {
  const file = await filePath(name);
  const raw = await readJsonText(file, name);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`json-store: ${name} повреждён, начинаем пустым`, error);
    return [];
  }
}

export async function readJsonObject<T extends object>(
  name: string,
  fallback: T,
): Promise<T> {
  const file = await filePath(name);
  const raw = await readJsonText(file, name);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    console.error(`json-store: ${name} повреждён, берём запасной`, error);
    return fallback;
  }
}

async function readJsonText(file: string, name: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
    const seed = path.join(LOCAL_DIR, name);
    if (seed === file) return null;
    try {
      return await readFile(seed, 'utf8');
    } catch {
      return null;
    }
  }
}

export async function writeJsonFile(name: string, value: unknown): Promise<void> {
  const file = await filePath(name);
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await rename(temp, file);
}
