import { readStoredFile, writeStoredFile } from './json-store';

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
  const fileName = `${attemptId}.${ext}`;
  await writeStoredFile(`uploads/${fileName}`, buffer, type);
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
  const buffer = await readStoredFile(`uploads/${fileName}`);
  if (!buffer) return null;
  return { buffer, type };
}
