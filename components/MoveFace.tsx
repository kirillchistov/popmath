import { DISCRIMINANT_FACE } from '@/lib/faces';

export function MoveFace() {
  return (
    <figure className="move-face">
      <div className="move-face-stage" aria-hidden="true">
        <svg className="move-face-critter" viewBox="0 0 72 72">
          <ellipse className="paper" cx="36" cy="34" rx="14" ry="12" />
          <path className="paper ear" d="M24 28l-2-10 8 6z" />
          <path className="paper ear" d="M48 28l2-10-8 6z" />
          <circle className="ink" cx="30" cy="33" r="1.5" />
          <circle className="ink" cx="42" cy="33" r="1.5" />
          <path className="mouth" d="M32 39c2.2 2 6 2 8 0" />
        </svg>
        <svg className="move-face-frame" viewBox="0 0 72 72">
          <path className="frame" d="M16 14h40v30H16z" />
          <rect className="sill" x="8" y="42" width="56" height="22" />
        </svg>
      </div>
      <figcaption>
        <strong>{DISCRIMINANT_FACE.name}</strong>
        <p>{DISCRIMINANT_FACE.line}</p>
      </figcaption>
    </figure>
  );
}
