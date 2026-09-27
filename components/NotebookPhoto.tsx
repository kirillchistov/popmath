'use client';

import { useRef } from 'react';

export function NotebookPhoto({
  photo,
  onChange,
}: {
  photo: File | null;
  onChange: (file: File | null) => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const pick = (files: FileList | null) => {
    onChange(files?.[0] ?? null);
  };

  return (
    <div className="photo-pick">
      <span className="eyebrow">Фото тетради</span>
      <div className="photo-actions">
        <button
          className="btn"
          type="button"
          onClick={() => galleryRef.current?.click()}
        >
          Загрузить фото
        </button>
        <button
          className="btn photo-camera"
          type="button"
          onClick={() => cameraRef.current?.click()}
        >
          Сделать фото
        </button>
        {photo ? (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              onChange(null);
              if (galleryRef.current) galleryRef.current.value = '';
              if (cameraRef.current) cameraRef.current.value = '';
            }}
          >
            Убрать
          </button>
        ) : null}
      </div>
      <input
        ref={galleryRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => pick(event.target.files)}
      />
      <input
        ref={cameraRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => pick(event.target.files)}
      />
      <span className="timer-hint">
        {photo
          ? photo.name
          : 'Можно проверить и без снимка. Столбик или чертёж — если удобно.'}
      </span>
    </div>
  );
}
