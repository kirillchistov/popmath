import { readJsonObject, writeJsonFile } from './json-store';
import type { Support, Task } from './types';

const FILE = 'content-overlay.json';

export interface OverlaySupport extends Support {
  id: string;
  topic_id: string;
}

export interface ContentOverlay {
  tasks: Task[];
  supports: OverlaySupport[];
}

function emptyOverlay(): ContentOverlay {
  return { tasks: [], supports: [] };
}

export async function readOverlay(): Promise<ContentOverlay> {
  const parsed = await readJsonObject<Partial<ContentOverlay>>(
    FILE,
    emptyOverlay(),
  );
  return {
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    supports: Array.isArray(parsed.supports) ? parsed.supports : [],
  };
}

async function writeOverlay(overlay: ContentOverlay): Promise<void> {
  await writeJsonFile(FILE, overlay);
}

export async function addOverlayTask(task: Task): Promise<Task> {
  const overlay = await readOverlay();
  const index = overlay.tasks.findIndex((item) => item.id === task.id);
  if (index === -1) overlay.tasks.push(task);
  else overlay.tasks[index] = task;
  await writeOverlay(overlay);
  return task;
}

export async function addOverlaySupport(
  support: OverlaySupport,
): Promise<OverlaySupport> {
  const overlay = await readOverlay();
  const index = overlay.supports.findIndex((item) => item.id === support.id);
  if (index === -1) overlay.supports.push(support);
  else overlay.supports[index] = support;
  await writeOverlay(overlay);
  return support;
}
