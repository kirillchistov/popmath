import { readJsonArray, writeJsonFile } from './json-store';
import type { TheoryMark, TheoryMarkKind } from './types';

const FILE = 'theory-marks.json';

async function readAll(): Promise<TheoryMark[]> {
  return readJsonArray<TheoryMark>(FILE);
}

async function writeAll(items: TheoryMark[]): Promise<void> {
  await writeJsonFile(FILE, items);
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
