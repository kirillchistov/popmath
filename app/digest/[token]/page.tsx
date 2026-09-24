interface DigestPageProps {
  params: Promise<{ token: string }>;
}

export default async function DigestPage({ params }: DigestPageProps) {
  const { token } = await params;

  return (
    <div className="app">
      <article className="panel empty-card">
        <div className="eyebrow">Недельный отчёт</div>
        <h1>Родителю без входа</h1>
        <p>
          Эта страница открывается по ссылке, без логина. Текст недели появится
          на этапе 5. Токен сейчас только заготовка: {token}.
        </p>
      </article>
    </div>
  );
}
