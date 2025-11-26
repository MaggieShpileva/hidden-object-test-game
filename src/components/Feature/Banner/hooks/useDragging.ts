import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import type { RefObject } from 'react';

interface UseDraggingProps {
  bannerRef: RefObject<HTMLDivElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
  onSceneOffsetChange?: (offsetX: number) => void;
  onDragStart?: () => void;
}

export const useDragging = ({
  bannerRef,
  sceneRef,
  onSceneOffsetChange,
  onDragStart,
}: UseDraggingProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(0);
  const lastTranslateRef = useRef(0);
  const startTranslateRef = useRef(0);
  const maxTranslateRef = useRef(0);
  const setTranslateRef = useRef<((value: number) => void) | null>(null);
  const snapStepRef = useRef(0);

  const getEventPosX = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return e.touches[0].clientX;
    }
    return e.clientX;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (sceneRef.current) {
      const currentX = gsap.getProperty(sceneRef.current, 'x') as number;
      const current = currentX || 0;
      lastTranslateRef.current = current;
      startTranslateRef.current = current;
    }
    setIsDragging(true);
    dragStartRef.current = getEventPosX(e.nativeEvent as MouseEvent | TouchEvent);
    onDragStart?.();
  };

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!setTranslateRef.current) return;

      const currentX = getEventPosX(e);
      const deltaX = currentX - dragStartRef.current;
      const newTranslate = lastTranslateRef.current + deltaX;
      const clamped = gsap.utils.clamp(-maxTranslateRef.current, 0)(newTranslate);

      setTranslateRef.current(clamped);
      onSceneOffsetChange?.(clamped);
    },
    [onSceneOffsetChange]
  );

  const handleEnd = useCallback(() => {
    if (!setTranslateRef.current || !sceneRef.current) return;

    const currentX = gsap.getProperty(sceneRef.current, 'x') as number;
    const clamped = gsap.utils.clamp(-maxTranslateRef.current, 0)(currentX);

    // Вычисляем процент перемещения
    const delta = Math.abs(clamped - startTranslateRef.current);
    const deltaPercent = (delta / maxTranslateRef.current) * 100;

    // Если перемещение >= 15%, применяем прилипание (более чувствительное)
    let targetX = clamped;
    if (deltaPercent >= 15 && snapStepRef.current > 0) {
      // Определяем направление
      const isMovingLeft = clamped < startTranslateRef.current;

      // Вычисляем ближайшую позицию прилипания (кратное 30%)
      const currentStep = Math.round(((Math.abs(clamped) / maxTranslateRef.current) * 100) / 30);
      const targetStep = isMovingLeft ? currentStep + 1 : currentStep - 1;
      const targetPercent = Math.max(0, Math.min(100, targetStep * 30));
      targetX = -(maxTranslateRef.current * targetPercent) / 100;
      targetX = gsap.utils.clamp(-maxTranslateRef.current, 0)(targetX);
    } else if (deltaPercent > 0) {
      // Даже при малом перемещении прилипаем к ближайшей позиции
      const currentStep = Math.round(((Math.abs(clamped) / maxTranslateRef.current) * 100) / 30);
      const targetPercent = currentStep * 30;
      targetX = -(maxTranslateRef.current * targetPercent) / 100;
      targetX = gsap.utils.clamp(-maxTranslateRef.current, 0)(targetX);
    }

    // Анимируем к целевой позиции с более сильным эффектом
    gsap.to(sceneRef.current, {
      x: targetX,
      duration: 0.2,
      ease: 'power3.out',
      onUpdate: () => {
        const x = gsap.getProperty(sceneRef.current, 'x') as number;
        if (setTranslateRef.current) {
          setTranslateRef.current(x);
        }
        onSceneOffsetChange?.(x);
      },
      onComplete: () => {
        lastTranslateRef.current = targetX;
        onSceneOffsetChange?.(targetX);
        setIsDragging(false);
      },
    });
  }, [onSceneOffsetChange, sceneRef]);

  // Инициализация и расчет максимального перемещения
  useEffect(() => {
    if (!sceneRef.current) return;

    // Инициализируем quickSetter для производительности
    setTranslateRef.current = gsap.quickSetter(sceneRef.current, 'x', 'px') as (
      value: number
    ) => void;

    const calculateMaxTranslate = () => {
      if (bannerRef.current && sceneRef.current) {
        const bannerWidth = bannerRef.current.offsetWidth;
        const sceneWidth = sceneRef.current.offsetWidth;
        const max = Math.max(0, sceneWidth - bannerWidth);
        maxTranslateRef.current = max;

        // Вычисляем шаг прилипания (30% от максимального перемещения)
        snapStepRef.current = max * 0.3;

        // Ограничиваем текущий translate при изменении размера
        const currentX = gsap.getProperty(sceneRef.current, 'x') as number;
        const clamped = gsap.utils.clamp(-max, 0)(currentX);
        if (setTranslateRef.current) {
          setTranslateRef.current(clamped);
        }
        lastTranslateRef.current = clamped;
        startTranslateRef.current = clamped;
        onSceneOffsetChange?.(clamped);
      }
    };

    calculateMaxTranslate();
    window.addEventListener('resize', calculateMaxTranslate);

    return () => {
      window.removeEventListener('resize', calculateMaxTranslate);
      if (setTranslateRef.current) {
        setTranslateRef.current = null;
      }
    };
  }, [bannerRef, sceneRef, onSceneOffsetChange]);

  // Обработка событий мыши и тач-событий
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e);
    };
    const handleTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return {
    isDragging,
    handleStart,
  };
};
