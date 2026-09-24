import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import type { DigestPayload, DigestRecord } from './types';

const STORE_PATH = path.join(process.cwd(), 'data', 'digests.json');
const TTL_DAYS = 14;

async function readAll(): Promise<DigestRecord[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DigestRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(items: DigestRecord[]): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(items, null, 2) + '\n', 'utf8');
}

export function isDigestAlive(item: DigestRecord, now = Date.now()): boolean {
  return new Date(item.expires_at).getTime() > now;
}

export async function getDigestByToken(
  token: string,
): Promise<DigestRecord | undefined> {
  const items = await readAll();
  const found = items.find((item) => item.token === token);
  if (!found || !isDigestAlive(found)) return undefined;
  return found;
}

export async function listLatestDigests(): Promise<DigestRecord[]> {
  const items = await readAll();
  const latest = new Map<string, DigestRecord>();
  for (const item of items.sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    if (!latest.has(item.student_id)) latest.set(item.student_id, item);
  }
  return [...latest.values()];
}

export async function saveDigest(input: {
  student_id: string;
  week_start: string;
  payload: DigestPayload;
}): Promise<DigestRecord> {
  const now = new Date();
  const expires = new Date(now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const record: DigestRecord = {
    token: randomBytes(18).toString('base64url'),
    student_id: input.student_id,
    week_start: input.week_start,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    sent_at: null,
    payload: input.payload,
  };

  const items = await readAll();
  const next = items.map((item) => {
    if (item.student_id !== input.student_id || !isDigestAlive(item, now.getTime())) {
      return item;
    }
    return { ...item, expires_at: now.toISOString() };
  });
  next.push(record);
  await writeAll(next);
  return record;
}

export async function markDigestSent(token: string): Promise<DigestRecord | undefined> {
  const items = await readAll();
  const index = items.findIndex((item) => item.token === token);
  if (index === -1) return undefined;
  const updated = { ...items[index], sent_at: new Date().toISOString() };
  items[index] = updated;
  await writeAll(items);
  return updated;
}
