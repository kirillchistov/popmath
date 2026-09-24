import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Support, Task } from './types';

const STORE_PATH = path.join(process.cwd(), 'data', 'content-overlay.json');

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
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ContentOverlay>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      supports: Array.isArray(parsed.supports) ? parsed.supports : [],
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return emptyOverlay();
    throw error;
  }
}

async function writeOverlay(overlay: ContentOverlay): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(overlay, null, 2) + '\n', 'utf8');
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
