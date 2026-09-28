'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { cropToJpeg } from '@/lib/crop-image';

export function HomeworkCrop({
  src,
  title,
  onCancel,
  onConfirm,
}: {
  src: string;
  title: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_unused: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const confirm = async () => {
    if (!area || busy) return;
    setBusy(true);
    try {
      const blob = await cropToJpeg(src, area);
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel practice-card">
      <div className="eyebrow">Обрезать</div>
      <h2>{title}</h2>
      <p>Рамка — одна задача. Если влезло две, уменьши окно.</p>
      <div className="homework-crop">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          minZoom={1}
          maxZoom={4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <label className="field">
        <span className="eyebrow">Крупнее</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>
      <div className="hero-actions">
        <button
          className="btn btn-primary"
          type="button"
          disabled={busy || !area}
          onClick={() => void confirm()}
        >
          {busy ? 'Режу…' : 'Это та задача'}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          Другое фото
        </button>
      </div>
    </article>
  );
}
