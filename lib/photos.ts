import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

export function photoExt(type: string): string | null {
  return TYPES[type] ?? null;
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
  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${attemptId}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);
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
    const buffer = await readFile(path.join(UPLOAD_DIR, fileName));
    return { buffer, type };
  } catch {
    return null;
  }
}
