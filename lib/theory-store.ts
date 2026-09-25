import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { TheoryMark, TheoryMarkKind } from './types';

const STORE_PATH = path.join(process.cwd(), 'data', 'theory-marks.json');

async function readAll(): Promise<TheoryMark[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TheoryMark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(items: TheoryMark[]): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(items, null, 2) + '\n', 'utf8');
}

export async function listTheoryMarks(studentId?: string): Promise<TheoryMark[]> {
  const items = await readAll();
  return studentId
    ? items.filter((item) => item.student_id === studentId)
    : items;
}

export async function upsertTheoryMark(input: {
  student_id: string;
  item_id: string;
  mark: TheoryMarkKind;
  note?: string;
}): Promise<TheoryMark> {
  const items = await readAll();
  const next: TheoryMark = {
    student_id: input.student_id,
    item_id: input.item_id,
    mark: input.mark,
    note: input.note?.trim() ?? '',
    updated_at: new Date().toISOString(),
  };
  const index = items.findIndex(
    (item) =>
      item.student_id === input.student_id && item.item_id === input.item_id,
  );
  if (index === -1) items.push(next);
  else items[index] = next;
  await writeAll(items);
  return next;
}
