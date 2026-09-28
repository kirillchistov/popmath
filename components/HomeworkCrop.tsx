'use client';

import { useCallback, useRef, useState } from 'react';
import ReactCrop, {
  convertToPixelCrop,
  type Crop,
  type PercentCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { blobFromUrl, cropToJpeg } from '@/lib/crop-image';

const START: PercentCrop = {
  unit: '%',
  x: 4,
  y: 4,
  width: 92,
  height: 92,
};

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
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>(START);
  const [busy, setBusy] = useState(false);

  const onImageLoad = useCallback(() => {
    setCrop(START);
  }, []);

  const confirm = async (whole: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (whole) {
        onConfirm(await blobFromUrl(src));
        return;
      }
      const image = imageRef.current;
      if (!image || image.width < 8 || image.height < 8) {
        onConfirm(await blobFromUrl(src));
        return;
      }
      const pixels = convertToPixelCrop(crop, image.width, image.height);
      if (pixels.width < 8 || pixels.height < 8) {
        onConfirm(await blobFromUrl(src));
        return;
      }
      onConfirm(await cropToJpeg(image, pixels));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel practice-card">
      <div className="eyebrow">Обрезать</div>
      <h2>{title}</h2>
      <p>
        Тяни углы и стороны рамки — ширину и высоту отдельно. Если фото уже одно
        задание, можно взять всё.
      </p>
      <div className="homework-crop">
        <ReactCrop
          crop={crop}
          keepSelection
          minWidth={24}
          minHeight={24}
          onChange={(_, percent) => setCrop(percent)}
        >
          <img ref={imageRef} src={src} alt="" onLoad={onImageLoad} />
        </ReactCrop>
      </div>
      <div className="hero-actions">
        <button
          className="btn btn-primary"
          type="button"
          disabled={busy}
          onClick={() => void confirm(false)}
        >
          {busy ? 'Режу…' : 'Это та задача'}
        </button>
        <button
          className="btn"
          type="button"
          disabled={busy}
          onClick={() => void confirm(true)}
        >
          Всё фото
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          Другое фото
        </button>
      </div>
    </article>
  );
}
