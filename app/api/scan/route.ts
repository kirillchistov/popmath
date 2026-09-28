import { NextResponse } from 'next/server';
import { PHOTO_MAX_BYTES, photoExt } from '@/lib/photos';
import { getSession } from '@/lib/session';
import { runScan, scanModelReady } from '@/lib/scan-model';
import type { ScanMode, ScanTopicHint } from '@/lib/scan';
import { getLiveTopic } from '@/lib/live-content';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ready: scanModelReady() });
}

function asMode(value: unknown): ScanMode | null {
  return value === 'read' || value === 'algo' || value === 'review' ? value : null;
}

function takeFile(value: FormDataEntryValue | null): File | null {
  if (value instanceof File && value.size > 0) return value;
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!scanModelReady()) {
    return NextResponse.json(
      { error: 'Нет ключа модели. Тьютор добавит ключ Яндекс AI Studio.' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Не собралось фото' }, { status: 400 });
  }

  const mode = asMode(form.get('mode'));
  if (!mode) {
    return NextResponse.json({ error: 'Неизвестный режим' }, { status: 400 });
  }

  const prompt = String(form.get('prompt') ?? '').trim();
  const workText = String(form.get('work_text') ?? '').trim();
  const topicId = String(form.get('topic_id') ?? '').trim();
  const problemImage = takeFile(form.get('image'));
  const workImage = takeFile(form.get('work'));

  for (const file of [problemImage, workImage]) {
    if (!file) continue;
    if (file.size > PHOTO_MAX_BYTES || !photoExt(file.type)) {
      return NextResponse.json(
        { error: 'Нужен jpg, png или webp до 4 МБ' },
        { status: 400 },
      );
    }
  }

  if (mode === 'read' && !problemImage) {
    return NextResponse.json({ error: 'Нужно фото условия' }, { status: 400 });
  }
  if (mode === 'algo' && !prompt) {
    return NextResponse.json({ error: 'Сначала текст условия' }, { status: 400 });
  }
  if (mode === 'review' && (!prompt || (!workImage && !workText))) {
    return NextResponse.json(
      { error: 'Нужны текст условия и ход — текстом или фото' },
      { status: 400 },
    );
  }

  let topic: ScanTopicHint | undefined;
  if (topicId) {
    const live = await getLiveTopic(topicId);
    if (live) {
      topic = {
        id: live.id,
        title: live.title,
        phrase: live.phrase,
        steps: live.steps,
        traps: live.traps,
      };
    }
  }

  try {
    const result = await runScan({
      mode,
      prompt,
      workText,
      topic,
      problemImage,
      workImage,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Не удалось разобрать';
    console.error('POST /api/scan', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
