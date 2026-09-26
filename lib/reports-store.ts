import { randomUUID } from 'node:crypto';
import { readJsonArray, writeJsonFile } from './json-store';

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

const FILE = 'reports.json';

async function readAll(): Promise<TrainerReport[]> {
  return readJsonArray<TrainerReport>(FILE);
}

async function writeAll(items: TrainerReport[]): Promise<void> {
  await writeJsonFile(FILE, items);
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
