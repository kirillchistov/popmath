import { getLiveTopic } from './live-content';
import { weekStartISO } from './plan';
import { getStudentPlan } from './student-plan';
import { listAttempts } from './store';
import { getTheoryItem } from './theory';
import { listTheoryMarks } from './theory-store';
import type { DigestPayload, DigestTopicLine, ErrorCode, TopicState } from './types';

const PARENT_ERROR: Record<ErrorCode, { title: string; body: string }> = {
  inattention: {
    title: 'Чаще всего — знак или недочитанная строка',
    body: 'Это не характер и не «опять невнимательная». Место, которое ловят глазами до счёта. Дома полезно спросить: «что просила задача?» — не «почему опять ошибка».',
  },
  freeze: {
    title: 'Долго не начинает или пропускает',
    body: 'Это ступор перед пустым листом, не отказ заниматься. Ещё одна задача того же типа сейчас не поможет. Нужна пауза или короткая опора «с чего выписать».',
  },
  knowledge: {
    title: 'Тема ещё не собралась',
    body: 'Картина не целая. Это дыра в ходе, не лень. Короткий круг по одной теме лучше часа «объясни ещё раз всё».',
  },
  algorithm: {
    title: 'Ход ещё шатается',
    body: 'Знакомо, но шаги не держатся сами. Сначала опора на 3–5 строк, потом одна задача. Не новый учебник.',
  },
  calculation: {
    title: 'Сбивается счёт после верного хода',
    body: 'Формула может быть на месте, путаются числа. Короткий счёт без новой темы. Калькулятор на экзамене нельзя — дома тоже лучше столбик и проверка.',
  },
  strategy: {
    title: 'Не тот порядок шагов',
    body: 'Берёт счёт раньше, чем тип. Дома: «что это за задача?» и только потом числа. Особенно в геометрии и тексте.',
  },
};

function weekLabel(weekStart: string): string {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${fmt(start)} — ${fmt(end)}`;
}

function workingNote(state: TopicState | undefined): string {
  if (state === 'hole') {
    return 'Здесь чаще ломается ход. Это место прибавки на неделе, не приговор.';
  }
  if (state === 'shaky') {
    return 'Тема как будто знакома, но устойчивого хода ещё нет.';
  }
  if (state === 'untouched') {
    return 'Новая тема. Одна новая в день, без марафона.';
  }
  return 'Короткое повторение, чтобы недавнее не стёрлось.';
}

function dominant(codes: ErrorCode[]): ErrorCode | null {
  if (codes.length === 0) return null;
  const counts = new Map<ErrorCode, number>();
  for (const code of codes) {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

function daysWithAttempts(isoDates: string[]): number {
  return new Set(isoDates).size;
}

export async function buildDigestPayload(
  studentId: string,
  now = new Date(),
): Promise<DigestPayload> {
  const weekStart = weekStartISO(now);
  const [plan, attempts, theoryMarks] = await Promise.all([
    getStudentPlan(studentId),
    listAttempts(studentId),
    listTheoryMarks(studentId),
  ]);
  const weekItems = attempts.filter((item) => item.created_at.slice(0, 10) >= weekStart);
  const errorCodes = weekItems
    .filter((item) => !item.correct)
    .flatMap((item) => (item.self_tag ? [item.self_tag] : (item.error_codes ?? [])));
  const main = dominant(errorCodes);

  const holds: DigestTopicLine[] = [];
  for (const item of plan.progress.filter((entry) => entry.state === 'holds')) {
    const topic = await getLiveTopic(item.topic_id);
    holds.push({
      title: topic?.title ?? item.topic_id,
      note: 'Уже не разваливается. Можно коротко повторить, не экзамен.',
    });
  }

  const working: DigestTopicLine[] = [];
  if (!plan.quizDone) {
    working.push({
      title: 'Короткий квиз',
      note: 'Ещё знакомимся, где ход уже есть. Это не весь ОГЭ и не оценка за четверть.',
    });
  }
  for (const item of plan.queue) {
    const topic = await getLiveTopic(item.topic_id);
    const state = plan.progress.find((entry) => entry.topic_id === item.topic_id)?.state;
    working.push({
      title: topic?.title ?? item.topic_id,
      note: workingNote(state),
    });
  }

  const error = main
    ? PARENT_ERROR[main]
    : weekItems.length === 0
      ? {
          title: 'Пока мало заходов',
          body: 'Рано судить и о лени, и о таланте. Три коротких раза в неделю важнее одного субботнего марафона.',
        }
      : {
          title: 'Ошибок мало или они разные',
          body: 'Нет одного главного срыва. Держите короткий ритм и не ищите «плохой характер».',
        };

  const doHome = [
    '10–15 минут, одна штука. Потом можно остановиться.',
    'Спросить: «что сегодня было одной фразой?» — не проверять каждую тетрадь.',
  ];
  if (main === 'freeze') {
    doHome.push('Если не начинает — пауза или «выписать три строки», не следующая задача.');
  } else if (main === 'inattention') {
    doHome.push('Перед ответом: дочитать условие и глянуть знак. Без нравоучения.');
  } else if (plan.queue[0]?.topic_id === 'geometry') {
    doHome.push('В геометрии сначала назвать сюжет: углы, треугольник, площадь или клетка.');
  } else {
    doHome.push('Если тема новая — только она. Вторую новую на сегодня не открывать.');
  }

  const dontHome = [
    'Не сравнивать с одноклассниками и не считать «готовность к ОГЭ» в процентах.',
    'Не включать экзаменальный таймер и не сажать на час.',
    'Не говорить «ты опять» и не устраивать разбор после каждой ошибки.',
    'Не писать тьютору «ну что, как она?» — картина недели здесь.',
  ];

  const theoryGaps = theoryMarks
    .filter((item) => item.mark === 'forgot' || item.mark === 'question')
    .map((item) => {
      const title = getTheoryItem(item.item_id)?.title ?? item.item_id;
      return item.mark === 'question' ? `${title} — есть вопрос` : `${title} — не помнит`;
    });

  const letter = [
    `Неделя ${weekLabel(weekStart)}.`,
    holds.length
      ? `Уже держится: ${holds.map((item) => item.title).join(', ')}.`
      : 'Пока рано говорить, что что-то уже держится. Это старт, не пустая неделя.',
    working.length
      ? `В работе: ${working.map((item) => item.title).join(', ')}.`
      : 'Отдельной темы в работе нет.',
    theoryGaps.length
      ? `Теория 7 класса, пометки: ${theoryGaps.join('; ')}.`
      : '',
    `${error.title}. ${error.body}`,
    `Дома: ${doHome.join(' ')}`,
    `Не делать: ${dontHome.join(' ')}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    week_start: weekStart,
    week_label: weekLabel(weekStart),
    visits: daysWithAttempts(weekItems.map((item) => item.created_at.slice(0, 10))),
    holds,
    working,
    error_title: error.title,
    error_body: error.body,
    do_home: doHome,
    dont_home: dontHome,
    letter,
    theory_gaps: theoryGaps,
  };
}
