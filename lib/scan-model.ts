import type { ErrorCode, Support } from './types';
import {
  SCAN_ERROR_CODES,
  type ScanAlgoResult,
  type ScanMode,
  type ScanReadResult,
  type ScanReviewResult,
  type ScanTopicHint,
} from './scan';

const VOICE = `Ты помогаешь тревожной ученице 8–9 класса с домашним заданием в тренажёре «Матешка».
Это не зачёт и не банк ОГЭ. Фото не сохраняется.
Тон: короткие фразы, разговорно, без сюсюканья.
Запрещено: «молодец», «это должен знать каждый», рейтинги, стыд, «ты опять».
Отвечай ТОЛЬКО JSON без markdown и без обёртки \`\`\`.`;

function topicBlock(topic?: ScanTopicHint) {
  if (!topic) return 'Тема не выбрана. Определи тип сама, не натягивай лишнее.';
  return [
    `Тема, которую ученица отметила: ${topic.title}.`,
    `Фраза: ${topic.phrase}.`,
    `Наш алгоритм темы: ${topic.steps.join(' / ')}.`,
    `Ловушки темы: ${topic.traps.join(' / ')}.`,
    'Держись этого хода, если задача ложится. Если нет — скажи, что это другой сюжет.',
  ].join('\n');
}

function readPrompt(topic?: ScanTopicHint) {
  return `${VOICE}

Задача: с фото снять ОДНУ задачу. Если в кадре несколько — ту, что крупнее.
${topicBlock(topic)}

JSON:
{
  "prompt": "условие обычным текстом; степени как x^2, дроби как 1/2 или 3/4, корень как sqrt(9)",
  "readable": true,
  "note": "пусто, если прочитала; иначе коротко почему нет"
}
Если не разобрала чертёж или текст — readable: false, prompt можно оставить пустым. Не выдумывай числа.`;
}

function algoPrompt(text: string, topic?: ScanTopicHint) {
  return `${VOICE}

Условие уже проверила ученица (ему можно верить больше, чем фото):
"""
${text}
"""
${topicBlock(topic)}

Дай ход, не готовый ответ первым. 3–5 шагов. Похожий пример — тот же тип, ДРУГИЕ числа, с ответом.

JSON:
{
  "support": {
    "title": "короткое имя хода",
    "metaphor": "образ в одну фразу",
    "anchor": "что поймать глазами до счёта",
    "steps": ["шаг 1", "шаг 2", "шаг 3"],
    "body": "запасная строка"
  },
  "similar": {
    "prompt": "похожая задача с другими числами",
    "answer": "ответ",
    "hint": "один якорь"
  },
  "answer": "ответ исходной задачи — только здесь, не в первом шаге"
}
Если не хватает чертежа — не выдумывай длины. Напиши это в steps.`;
}

function reviewPrompt(text: string, topic?: ScanTopicHint) {
  return `${VOICE}

Условие:
"""
${text}
"""
${topicBlock(topic)}

Второе изображение — фото хода ученицы. Смотри как на картинку. Не пытайся идеально оцифровать почерк.
Не ставь школьную оценку. Если ход выглядит верным — error_code: "none".
error_code только из списка: knowledge, algorithm, inattention, calculation, freeze, strategy, none.

JSON:
{
  "review": {
    "error_code": "calculation",
    "title": "коротко, где сорвалось",
    "body": "два-три предложения, без стыда",
    "next_step": "один следующий ход"
  },
  "support": {
    "title": "ход, если ещё нужен",
    "metaphor": "",
    "anchor": "",
    "steps": ["шаг"],
    "body": ""
  }
}
support можно опустить, если достаточно next_step.`;
}

function userParts(
  text: string,
  images: { url: string; label: string }[],
): Array<
  { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
> {
  const parts: Array<
    { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  > = [{ type: 'text', text }];
  for (const image of images) {
    parts.push({ type: 'text', text: image.label });
    parts.push({ type: 'image_url', image_url: { url: image.url } });
  }
  return parts;
}

export async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type || 'image/jpeg';
  return `data:${type};base64,${buffer.toString('base64')}`;
}

function parseJson(raw: string): unknown {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(trimmed) as unknown;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asSupport(value: unknown): Support | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const card = value as Record<string, unknown>;
  const steps = Array.isArray(card.steps)
    ? card.steps.map((step) => asString(step)).filter(Boolean)
    : [];
  const title = asString(card.title);
  if (!title && steps.length === 0 && !asString(card.body)) return undefined;
  return {
    title: title || 'Ход',
    metaphor: asString(card.metaphor) || undefined,
    anchor: asString(card.anchor) || undefined,
    steps: steps.length > 0 ? steps.slice(0, 6) : undefined,
    body: asString(card.body) || title,
  };
}

export function scanModelReady() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function runScan(input: {
  mode: ScanMode;
  prompt?: string;
  topic?: ScanTopicHint;
  problemImage?: File | null;
  workImage?: File | null;
}): Promise<ScanReadResult | ScanAlgoResult | ScanReviewResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('Нет ключа модели. Тьютор добавит OPENAI_API_KEY.');
  }
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const images: { url: string; label: string }[] = [];
  if (input.problemImage) {
    images.push({
      url: await fileToDataUrl(input.problemImage),
      label: 'Фото условия:',
    });
  }
  if (input.workImage) {
    images.push({
      url: await fileToDataUrl(input.workImage),
      label: 'Фото хода:',
    });
  }

  let text = '';
  if (input.mode === 'read') text = readPrompt(input.topic);
  if (input.mode === 'algo') text = algoPrompt(input.prompt ?? '', input.topic);
  if (input.mode === 'review') text = reviewPrompt(input.prompt ?? '', input.topic);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: userParts(text, images),
        },
      ],
    }),
  });
  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Модель не ответила');
  }
  const content = payload.choices?.[0]?.message?.content ?? '';
  let parsed: Record<string, unknown>;
  try {
    parsed = parseJson(content) as Record<string, unknown>;
  } catch {
    throw new Error('Модель вернула не JSON. Попробуй ещё раз.');
  }

  if (input.mode === 'read') {
    return {
      prompt: asString(parsed.prompt),
      readable: parsed.readable !== false,
      note: asString(parsed.note) || undefined,
    };
  }

  if (input.mode === 'algo') {
    const support = asSupport(parsed.support);
    const similarRaw =
      parsed.similar && typeof parsed.similar === 'object'
        ? (parsed.similar as Record<string, unknown>)
        : {};
    if (!support) throw new Error('Не собрался алгоритм. Поправь текст и ещё раз.');
    return {
      support,
      similar: {
        prompt: asString(similarRaw.prompt),
        answer: asString(similarRaw.answer),
        hint: asString(similarRaw.hint),
      },
      answer: asString(parsed.answer) || undefined,
    };
  }

  const reviewRaw =
    parsed.review && typeof parsed.review === 'object'
      ? (parsed.review as Record<string, unknown>)
      : parsed;
  const code = asString(reviewRaw.error_code) as ErrorCode | 'none';
  return {
    review: {
      error_code: SCAN_ERROR_CODES.includes(code) ? code : 'algorithm',
      title: asString(reviewRaw.title) || 'Смотри ход',
      body: asString(reviewRaw.body),
      next_step: asString(reviewRaw.next_step),
    },
    support: asSupport(parsed.support),
  };
}
