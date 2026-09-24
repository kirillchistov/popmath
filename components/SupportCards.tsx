import type { Support } from '@/lib/types';

export function SupportCards({ supports }: { supports: Support[] }) {
  if (supports.length === 0) return null;

  return (
    <div className="stack">
      {supports.map((card) => (
        <article className="panel section-card" key={card.id ?? card.title}>
          <div className="eyebrow">Опора</div>
          <h2>{card.title}</h2>
          {card.metaphor ? <p className="prompt">{card.metaphor}</p> : null}
          {card.anchor ? <p>Якорь: {card.anchor}</p> : null}
          {card.steps && card.steps.length > 0 ? (
            <div className="steps">
              {card.steps.map((step) => (
                <div className="step" key={step}>
                  <div>{step}</div>
                </div>
              ))}
            </div>
          ) : (
            <p>{card.body}</p>
          )}
        </article>
      ))}
    </div>
  );
}
