export const ALICE_URL = 'https://alice.yandex.ru/';

export function AliceHint({
  kind,
}: {
  kind: 'problem' | 'work';
}) {
  const problem = kind === 'problem';
  return (
    <div className="alice-hint">
      <p>
        {problem
          ? 'Извини — фото не разобрала. Модель сейчас плохо читает картинку, это не ты.'
          : 'Извини — фото хода не разобрала. Оно часто длинное, простой модели тяжело.'}
      </p>
      <p>
        Набери текст здесь или распознай в Алисе и вставь. Потом можно просить
        алгоритм.
      </p>
      <a className="btn" href={ALICE_URL} target="_blank" rel="noreferrer">
        Открыть Алису
      </a>
    </div>
  );
}
