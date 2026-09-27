'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from 'react-sketch-canvas';

export type NotebookRuled = 'lined' | 'grid';

export interface NotebookPadHandle {
  exportIfDrawn: () => Promise<File | null>;
  reset: () => void;
}

function dataUrlToFile(dataUrl: string, name: string): File | null {
  const [header, data] = dataUrl.split(',');
  if (!header || !data) return null;
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], name, { type: mime });
}

export const NotebookPad = forwardRef<
  NotebookPadHandle,
  {
    ruled: NotebookRuled;
    onDraw?: () => void;
  }
>(function NotebookPad({ ruled, onDraw }, ref) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const drawnRef = useRef(false);
  const [erase, setErase] = useState(false);
  const [open, setOpen] = useState(true);

  useImperativeHandle(ref, () => ({
    exportIfDrawn: async () => {
      const canvas = canvasRef.current;
      if (!canvas || !drawnRef.current) return null;
      const dataUrl = await canvas.exportImage('png');
      return dataUrlToFile(dataUrl, 'notebook.png');
    },
    reset: () => {
      canvasRef.current?.resetCanvas();
      canvasRef.current?.eraseMode(false);
      drawnRef.current = false;
      setErase(false);
    },
  }));

  const setMode = (next: boolean) => {
    setErase(next);
    canvasRef.current?.eraseMode(next);
  };

  return (
    <div className="notebook-pad">
      <div className="notebook-pad-head">
        <span className="eyebrow">Лист</span>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Свернуть' : 'Открыть лист'}
        </button>
      </div>
      {open ? (
        <>
          <div className="notebook-tools">
            <button
              className={`btn ${erase ? '' : 'btn-primary'}`}
              type="button"
              onClick={() => setMode(false)}
            >
              Карандаш
            </button>
            <button
              className={`btn ${erase ? 'btn-primary' : ''}`}
              type="button"
              onClick={() => setMode(true)}
            >
              Ластик
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => canvasRef.current?.undo()}
            >
              Отмена
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                canvasRef.current?.resetCanvas();
                drawnRef.current = false;
                setMode(false);
              }}
            >
              Стереть
            </button>
          </div>
          <div className="notebook-sheet" data-ruled={ruled}>
            <ReactSketchCanvas
              ref={canvasRef}
              width="100%"
              height="100%"
              strokeWidth={2}
              strokeColor="#28251d"
              eraserWidth={14}
              canvasColor="transparent"
              withViewBox
              style={{
                border: 'none',
                borderRadius: 0,
                background: 'transparent',
              }}
              onChange={(paths) => {
                const hasInk = paths.some(
                  (path) => path.drawMode && path.paths.length > 0,
                );
                drawnRef.current = hasInk;
                if (hasInk) onDraw?.();
              }}
            />
          </div>
          <span className="timer-hint">
            Столбик или схема прямо здесь. На телефоне можно свернуть и сфоткать
            бумажную.
          </span>
        </>
      ) : (
        <span className="timer-hint">
          Лист свёрнут. Можно считать на бумаге и приложить фото ниже.
        </span>
      )}
    </div>
  );
});
