import { readJsonArray, writeJsonFile } from './json-store';
import type { PlanOverride } from './types';

const FILE = 'plans.json';

function normalize(plan: Partial<PlanOverride> & { student_id: string }): PlanOverride {
  return {
    student_id: plan.student_id,
    order: Array.isArray(plan.order) ? plan.order : [],
    opened_new_topic_on: plan.opened_new_topic_on ?? null,
    assigned_task_ids: Array.isArray(plan.assigned_task_ids)
      ? plan.assigned_task_ids
      : [],
  };
}

async function readAll(): Promise<PlanOverride[]> {
  const parsed = await readJsonArray<PlanOverride>(FILE);
  return parsed.map((item) =>
    normalize({ ...item, student_id: item.student_id }),
  );
}

async function writeAll(plans: PlanOverride[]): Promise<void> {
  await writeJsonFile(FILE, plans);
}

export async function getPlanOverride(
  studentId: string,
): Promise<PlanOverride> {
  const plans = await readAll();
  return (
    plans.find((item) => item.student_id === studentId) ??
    normalize({ student_id: studentId })
  );
}

async function upsertPlan(
  studentId: string,
  patch: Partial<Omit<PlanOverride, 'student_id'>>,
): Promise<PlanOverride> {
  const plans = await readAll();
  const current = plans.find((item) => item.student_id === studentId);
  const next = normalize({
    student_id: studentId,
    order: patch.order ?? current?.order ?? [],
    opened_new_topic_on:
      patch.opened_new_topic_on !== undefined
        ? patch.opened_new_topic_on
        : (current?.opened_new_topic_on ?? null),
    assigned_task_ids:
      patch.assigned_task_ids ?? current?.assigned_task_ids ?? [],
  });
  const index = plans.findIndex((item) => item.student_id === studentId);
  if (index === -1) plans.push(next);
  else plans[index] = next;
  await writeAll(plans);
  return next;
}

export async function savePlanOrder(
  studentId: string,
  order: string[],
): Promise<PlanOverride> {
  return upsertPlan(studentId, { order });
}

export async function markOpenedNewTopic(
  studentId: string,
  day: string,
): Promise<PlanOverride> {
  return upsertPlan(studentId, { opened_new_topic_on: day });
}

export async function assignTaskToStudent(
  studentId: string,
  taskId: string,
  topicId?: string,
): Promise<PlanOverride> {
  const current = await getPlanOverride(studentId);
  const assigned = current.assigned_task_ids.includes(taskId)
    ? current.assigned_task_ids
    : [...current.assigned_task_ids, taskId];
  const order =
    topicId && !current.order.includes(topicId)
      ? [topicId, ...current.order]
      : topicId
        ? [topicId, ...current.order.filter((id) => id !== topicId)]
        : current.order;
  return upsertPlan(studentId, { assigned_task_ids: assigned, order });
}

export async function unassignTaskFromStudent(
  studentId: string,
  taskId: string,
): Promise<PlanOverride> {
  const current = await getPlanOverride(studentId);
  return upsertPlan(studentId, {
    assigned_task_ids: current.assigned_task_ids.filter((id) => id !== taskId),
  });
}
