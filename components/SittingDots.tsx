export function SittingDots({ done, total }: { done: number; total: number }) {
  if (total < 1) return null;
  const filled = Math.min(Math.max(done, 0), total);
  return (
    <div
      className="sitting-dots"
      role="img"
      aria-label={`В пачке закрыто ${filled} из ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index < filled ? 'on' : undefined} />
      ))}
    </div>
  );
}
