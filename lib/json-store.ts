import { get, put } from '@vercel/blob';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const LOCAL_DIR = path.join(process.cwd(), 'data');
const TMP_DIR = path.join('/tmp', 'mateshka-data');
const BLOB_PREFIX = 'mateshka/';

let resolvedDir: string | null = null;

export function blobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_STORE_ID?.trim(),
  );
}

function blobPath(name: string): string {
  return `${BLOB_PREFIX}${name}`;
}

function contentTypeFor(name: string): string {
  if (name.endsWith('.json')) return 'application/json';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

async function readBlob(name: string): Promise<Buffer | null> {
  const result = await get(blobPath(name), {
    access: 'private',
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const bytes = await new Response(result.stream).arrayBuffer();
  return Buffer.from(bytes);
}

async function writeBlob(
  name: string,
  body: Buffer | string,
  contentType: string,
): Promise<void> {
  await put(blobPath(name), body, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

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

async function readLocalBytes(name: string): Promise<Buffer | null> {
  const file = await filePath(name);
  try {
    return await readFile(file);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
    const seed = path.join(LOCAL_DIR, name);
    if (seed === file) return null;
    try {
      return await readFile(seed);
    } catch {
      return null;
    }
  }
}

export async function readStoredFile(name: string): Promise<Buffer | null> {
  if (blobConfigured()) {
    const remote = await readBlob(name);
    if (remote) return remote;
    const local = await readLocalBytes(name);
    if (!local) return null;
    await writeBlob(name, local, contentTypeFor(name));
    return local;
  }
  return readLocalBytes(name);
}

export async function writeStoredFile(
  name: string,
  body: Buffer | string,
  contentType = contentTypeFor(name),
): Promise<void> {
  if (blobConfigured()) {
    await writeBlob(name, body, contentType);
    return;
  }
  const file = await filePath(name);
  await mkdir(path.dirname(file), { recursive: true });
  if (typeof body === 'string') {
    const temp = `${file}.${process.pid}.tmp`;
    await writeFile(temp, body, 'utf8');
    await rename(temp, file);
    return;
  }
  await writeFile(file, body);
}

async function readJsonText(name: string): Promise<string | null> {
  const bytes = await readStoredFile(name);
  return bytes ? bytes.toString('utf8') : null;
}

export async function readJsonArray<T>(name: string): Promise<T[]> {
  const raw = await readJsonText(name);
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
  const raw = await readJsonText(name);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    console.error(`json-store: ${name} повреждён, берём запасной`, error);
    return fallback;
  }
}

export async function writeJsonFile(name: string, value: unknown): Promise<void> {
  await writeStoredFile(
    name,
    JSON.stringify(value, null, 2) + '\n',
    'application/json',
  );
}
