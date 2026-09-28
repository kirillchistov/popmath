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

function reviewPrompt(text: string, workText: string, topic?: ScanTopicHint) {
  const workBlock = workText.trim()
    ? `\nХод ученицы текстом:\n"""\n${workText.trim()}\n"""\n`
    : '';
  return `${VOICE}

Условие:
"""
${text}
"""
${workBlock}${topicBlock(topic)}

Если есть фото хода — смотри как на картинку. Не пытайся идеально оцифровать почерк.
Текст хода, если есть, можно читать напрямую.
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

function responseInput(
  text: string,
  images: { url: string; label: string }[],
) {
  if (images.length === 0) return text;
  const content: Array<Record<string, unknown>> = [
    { type: 'input_text', text },
  ];
  for (const image of images) {
    content.push({ type: 'input_text', text: image.label });
    content.push({ type: 'input_image', image_url: image.url });
  }
  return [{ role: 'user', content }];
}

function responseText(payload: Record<string, unknown>): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }
  const output = payload.output;
  if (!Array.isArray(output)) return '';
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.text === 'string') chunks.push(row.text);
    if (!Array.isArray(row.content)) continue;
    for (const part of row.content) {
      if (!part || typeof part !== 'object') continue;
      const block = part as Record<string, unknown>;
      if (typeof block.text === 'string') chunks.push(block.text);
    }
  }
  return chunks.join('\n');
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

const YANDEX_RESPONSES_URL = 'https://ai.api.cloud.yandex.net/v1/responses';
const DEFAULT_TEXT_MODEL = 'deepseek-v4.1-flash/latest';
const DEFAULT_VISION_MODEL = 'qwen3.6-35b-a3b/latest';

function yandexKey() {
  return (
    process.env.YANDEX_API_KEY?.trim() ||
    process.env.YANDEXAI_API_KEY?.trim() ||
    ''
  );
}

function yandexFolder() {
  return process.env.YANDEX_FOLDER_ID?.trim() || '';
}

function modelUri(raw: string, folder: string) {
  const value = raw.trim();
  if (!value) return '';
  if (value.includes('://')) {
    return value.replace(/^gpt:\/\/[^/]+/, `gpt://${folder}`);
  }
  return `gpt://${folder}/${value.replace(/^\/+/, '')}`;
}

export function scanModelReady() {
  return Boolean(yandexKey() && yandexFolder());
}

function emptyScanMessage(
  useVision: boolean,
  mode: ScanMode,
  workImage: boolean,
) {
  if (useVision && (mode === 'read' || workImage)) {
    return workImage && mode !== 'read'
      ? 'Извини — фото хода не разобрала. Набери шаги здесь или распознай в Алисе.'
      : 'Извини — фото не разобрала. Впиши условие руками или распознай в Алисе.';
  }
  return 'Модель промолчала. Можно опереться на шаги темы или набрать текст руками.';
}

function extractError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const data = payload as Record<string, unknown>;
  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  if (data.error && typeof data.error === 'object') {
    const nested = data.error as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message;
    }
  }
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

export async function runScan(input: {
  mode: ScanMode;
  prompt?: string;
  workText?: string;
  topic?: ScanTopicHint;
  problemImage?: File | null;
  workImage?: File | null;
}): Promise<ScanReadResult | ScanAlgoResult | ScanReviewResult> {
  const key = yandexKey();
  const folder = yandexFolder();
  if (!key || !folder) {
    throw new Error('Нет ключа модели. Тьютор добавит ключ Яндекс AI Studio.');
  }
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

  const useVision = images.length > 0;
  const model = modelUri(
    useVision
      ? process.env.YANDEX_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL
      : process.env.YANDEX_MODEL?.trim() || DEFAULT_TEXT_MODEL,
    folder,
  );

  let text = '';
  if (input.mode === 'read') text = readPrompt(input.topic);
  if (input.mode === 'algo') text = algoPrompt(input.prompt ?? '', input.topic);
  if (input.mode === 'review') {
    text = reviewPrompt(input.prompt ?? '', input.workText ?? '', input.topic);
  }

  const body: Record<string, unknown> = {
    model,
    instructions: 'Отвечай ТОЛЬКО JSON без markdown и без обёртки ```.',
    input: responseInput(text, useVision ? images : []),
    temperature: 0.2,
    max_output_tokens: 2500,
  };

  const response = await fetch(YANDEX_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${key}`,
      'Content-Type': 'application/json',
      'OpenAI-Project': folder,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(extractError(payload, 'Модель не ответила'));
  }
  const content = responseText(payload);
  if (!content.trim()) {
    throw new Error(emptyScanMessage(useVision, input.mode, Boolean(input.workImage)));
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = parseJson(content) as Record<string, unknown>;
  } catch {
    throw new Error(emptyScanMessage(useVision, input.mode, Boolean(input.workImage)));
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
