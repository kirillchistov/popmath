import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { dataDir } from './json-store';

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

export function photoExt(type: string): string | null {
  return TYPES[type] ?? null;
}

async function uploadDir(): Promise<string> {
  const dir = path.join(await dataDir(), 'uploads');
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function saveAttemptPhoto(
  attemptId: string,
  buffer: Buffer,
  type: string,
): Promise<string> {
  const ext = photoExt(type);
  if (!ext) {
    throw new Error('Unsupported image');
  }
  const dir = await uploadDir();
  const fileName = `${attemptId}.${ext}`;
  await writeFile(path.join(dir, fileName), buffer);
  return `/api/uploads/${fileName}`;
}

export async function readAttemptPhoto(fileName: string): Promise<{
  buffer: Buffer;
  type: string;
} | null> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(fileName)) {
    return null;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  const type =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  try {
    const buffer = await readFile(path.join(await uploadDir(), fileName));
    return { buffer, type };
  } catch {
    return null;
  }
}
