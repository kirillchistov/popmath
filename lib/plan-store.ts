import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PlanOverride } from './types';

const STORE_PATH = path.join(process.cwd(), 'data', 'plans.json');

async function readAll(): Promise<PlanOverride[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as PlanOverride[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw error;
  }
}

async function writeAll(plans: PlanOverride[]): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(plans, null, 2) + '\n', 'utf8');
}

export async function getPlanOverride(
  studentId: string,
): Promise<PlanOverride> {
  const plans = await readAll();
  return (
    plans.find((item) => item.student_id === studentId) ?? {
      student_id: studentId,
      order: [],
      opened_new_topic_on: null,
    }
  );
}

export async function savePlanOrder(
  studentId: string,
  order: string[],
): Promise<PlanOverride> {
  const plans = await readAll();
  const current = plans.find((item) => item.student_id === studentId);
  const next: PlanOverride = {
    student_id: studentId,
    order,
    opened_new_topic_on: current?.opened_new_topic_on ?? null,
  };
  const index = plans.findIndex((item) => item.student_id === studentId);
  if (index === -1) plans.push(next);
  else plans[index] = next;
  await writeAll(plans);
  return next;
}

export async function markOpenedNewTopic(
  studentId: string,
  day: string,
): Promise<PlanOverride> {
  const plans = await readAll();
  const current = plans.find((item) => item.student_id === studentId);
  const next: PlanOverride = {
    student_id: studentId,
    order: current?.order ?? [],
    opened_new_topic_on: day,
  };
  const index = plans.findIndex((item) => item.student_id === studentId);
  if (index === -1) plans.push(next);
  else plans[index] = next;
  await writeAll(plans);
  return next;
}
