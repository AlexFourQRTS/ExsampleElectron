import { useRef, useState, useCallback } from "react";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseRubberBandSelectionOptions {
  containerRef: React.RefObject<HTMLElement>;
  onSelectionEnd: (rect: SelectionRect) => void;
}

export function useRubberBandSelection({ containerRef, onSelectionEnd }: UseRubberBandSelectionOptions) {
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const bounds = container.getBoundingClientRect();
    return {
      x: clientX - bounds.left + container.scrollLeft,
      y: clientY - bounds.top + container.scrollTop,
    };
  }, [containerRef]);

  const buildRect = (start: { x: number; y: number }, end: { x: number; y: number }): SelectionRect => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !startPoint.current) return;
      const point = getRelativePoint(e.clientX, e.clientY);
      setSelectionRect(buildRect(startPoint.current, point));
    },
    [getRelativePoint]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current && selectionRect) {
      // Игнорируем случайные клики (совсем маленький прямоугольник)
      if (selectionRect.width > 4 || selectionRect.height > 4) {
        onSelectionEnd(selectionRect);
      }
    }
    isDragging.current = false;
    startPoint.current = null;
    setSelectionRect(null);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, onSelectionEnd, selectionRect]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Начинаем выделение только по левой кнопке и на пустом месте (не на строке)
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-selectable-row]")) return;

      const point = getRelativePoint(e.clientX, e.clientY);
      startPoint.current = point;
      isDragging.current = true;
      setSelectionRect(buildRect(point, point));

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [getRelativePoint, handleMouseMove, handleMouseUp]
  );

  return { selectionRect, handleMouseDown };
}
