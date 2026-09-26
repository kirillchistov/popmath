import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export interface TrainerReport {
  id: string;
  student_id: string;
  attempt_id: string;
  task_id: string;
  prompt: string;
  raw_answer: string;
  expected: string;
  emailed: boolean;
  created_at: string;
}

const STORE_PATH = path.join(process.cwd(), 'data', 'reports.json');

async function readAll(): Promise<TrainerReport[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TrainerReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(items: TrainerReport[]): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(items, null, 2) + '\n', 'utf8');
}

export async function listReports(): Promise<TrainerReport[]> {
  const items = await readAll();
  return items.sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function saveReport(
  draft: Omit<TrainerReport, 'id' | 'created_at'>,
): Promise<TrainerReport> {
  const report: TrainerReport = {
    ...draft,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  const items = await readAll();
  items.push(report);
  await writeAll(items);
  return report;
}
