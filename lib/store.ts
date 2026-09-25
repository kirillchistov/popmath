import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Attempt, AttemptDraft, ErrorCode } from './types';

const STORE_PATH = path.join(process.cwd(), 'data', 'attempts.json');

async function readAll(): Promise<Attempt[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Attempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(attempts: Attempt[]): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(attempts, null, 2) + '\n', 'utf8');
}

export async function saveAttempt(draft: AttemptDraft): Promise<Attempt> {
  const attempt: Attempt = {
    ...draft,
    id: randomUUID(),
    self_tag: draft.self_tag ?? null,
    created_at: new Date().toISOString(),
  };
  const attempts = await readAll();
  attempts.push(attempt);
  await writeAll(attempts);
  return attempt;
}

export async function listAttempts(studentId?: string): Promise<Attempt[]> {
  const attempts = await readAll();
  const filtered = studentId
    ? attempts.filter((item) => item.student_id === studentId)
    : attempts;
  return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getAttempt(id: string): Promise<Attempt | undefined> {
  const attempts = await readAll();
  return attempts.find((item) => item.id === id);
}

export async function attachAttemptPhoto(
  id: string,
  photoPath: string,
): Promise<Attempt | undefined> {
  const attempts = await readAll();
  const index = attempts.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  attempts[index] = { ...attempts[index], photo_path: photoPath };
  await writeAll(attempts);
  return attempts[index];
}

export async function updateAttemptTag(
  id: string,
  selfTag: ErrorCode,
  options: { replaceCodes?: boolean } = {},
): Promise<Attempt | undefined> {
  const attempts = await readAll();
  const index = attempts.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  const current = attempts[index];
  const errorCodes = options.replaceCodes
    ? [selfTag]
    : current.error_codes.includes(selfTag)
      ? current.error_codes
      : [...current.error_codes, selfTag];
  const updated: Attempt = {
    ...current,
    self_tag: selfTag,
    error_codes: errorCodes,
  };
  attempts[index] = updated;
  await writeAll(attempts);
  return updated;
}
