import type { PixelCrop } from 'react-image-crop';

const MAX_SIDE = 1600;

export async function cropToJpeg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sourceW = Math.max(1, crop.width * scaleX);
  const sourceH = Math.max(1, crop.height * scaleY);
  const scale = Math.min(1, MAX_SIDE / Math.max(sourceW, sourceH));
  const width = Math.max(1, Math.round(sourceW * scale));
  const height = Math.max(1, Math.round(sourceH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Нет холста');
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    sourceW,
    sourceH,
    0,
    0,
    width,
    height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Не удалось обрезать'));
        else resolve(blob);
      },
      'image/jpeg',
      0.85,
    );
  });
}

export async function blobFromUrl(src: string): Promise<Blob> {
  const response = await fetch(src);
  return response.blob();
}
