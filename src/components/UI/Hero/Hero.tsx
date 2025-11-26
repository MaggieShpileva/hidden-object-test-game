import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { gsap } from 'gsap';
import styles from './Hero.module.scss';
import IDLE_ANIMATE1 from '@assets/hero/idle/Idle-1.png';
import IDLE_ANIMATE3 from '@assets/hero/idle/Idle-3.png';
import IDLE_ANIMATE4 from '@assets/hero/idle/Idle-4.png';
import IDLE_ANIMATE6 from '@assets/hero/idle/Idle-6.png';
import IDLE_ANIMATE8 from '@assets/hero/idle/Idle-8.png';
import IDLE_ANIMATE9 from '@assets/hero/idle/Idle-9.png';
import IDLE_ANIMATE11 from '@assets/hero/idle/Idle-11.png';
import IDLE_ANIMATE13 from '@assets/hero/idle/Idle-13.png';
import IDLE_ANIMATE16 from '@assets/hero/idle/Idle-16.png';
import IDLE_ANIMATE17 from '@assets/hero/idle/Idle-17.png';
import RUN_ANIMATE1 from '@assets/hero/run/Run-1.png';
import RUN_ANIMATE2 from '@assets/hero/run/Run-2.png';
import RUN_ANIMATE3 from '@assets/hero/run/Run-3.png';
import RUN_ANIMATE4 from '@assets/hero/run/Run-4.png';
import RUN_ANIMATE5 from '@assets/hero/run/Run-5.png';
import RUN_ANIMATE6 from '@assets/hero/run/Run-6.png';
import RUN_ANIMATE7 from '@assets/hero/run/Run-7.png';
import RUN_ANIMATE8 from '@assets/hero/run/Run-8.png';
import RUN_ANIMATE9 from '@assets/hero/run/Run-9.png';
import RUN_ANIMATE10 from '@assets/hero/run/Run-10.png';
import RUN_ANIMATE11 from '@assets/hero/run/Run-11.png';

const IDLE_ANIMATE = [
  IDLE_ANIMATE1,
  IDLE_ANIMATE3,
  IDLE_ANIMATE4,
  IDLE_ANIMATE6,
  IDLE_ANIMATE8,
  IDLE_ANIMATE9,
  IDLE_ANIMATE11,
  IDLE_ANIMATE13,
  IDLE_ANIMATE16,
  IDLE_ANIMATE17,
];

const RUN_ANIMATE = [
  RUN_ANIMATE1,
  RUN_ANIMATE2,
  RUN_ANIMATE3,
  RUN_ANIMATE4,
  RUN_ANIMATE5,
  RUN_ANIMATE6,
  RUN_ANIMATE7,
  RUN_ANIMATE8,
  RUN_ANIMATE9,
  RUN_ANIMATE10,
  RUN_ANIMATE11,
];

const FPS = 12; // Кадров в секунду для плавной анимации
const FRAME_DELAY = 500 / FPS; // Задержка между кадрами в миллисекундах
const MOVE_SPEED = 20; // Скорость перемещения в пикселях за кадр

type AnimationType = 'idle' | 'run';
type Direction = 'left' | 'right';

export const Hero: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const animationTypeRef = useRef<AnimationType>('idle');
  const directionRef = useRef<Direction>('right');
  const moveTweenRef = useRef<gsap.core.Tween | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const containerBoundsRef = useRef({ width: 0, canvasWidth: 300, maxX: 0 });
  const lastBoundsUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    // Оптимизация canvas для лучшей производительности
    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
      desynchronized: true,
    });
    if (!ctx) return;

    // Оптимизация отрисовки
    ctx.imageSmoothingEnabled = false;

    let idleImages: HTMLImageElement[] = [];
    let runImages: HTMLImageElement[] = [];
    let loadedIdle = 0;
    let loadedRun = 0;
    let frame = 0;
    let isAnimationRunning = false;

    // Загружаем все кадры
    const loadImages = () => {
      const checkAndStart = () => {
        if (loadedIdle === IDLE_ANIMATE.length && loadedRun === RUN_ANIMATE.length) {
          if (idleImages.length > 0 || runImages.length > 0) {
            startAnimation();
          }
        }
      };

      // Загружаем idle анимацию
      IDLE_ANIMATE.forEach((src) => {
        const img = new Image();
        img.onload = () => {
          loadedIdle++;
          checkAndStart();
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${src}`);
          loadedIdle++;
          checkAndStart();
        };
        img.src = src;
        idleImages.push(img);
      });

      // Загружаем run анимацию
      RUN_ANIMATE.forEach((src) => {
        const img = new Image();
        img.onload = () => {
          loadedRun++;
          checkAndStart();
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${src}`);
          loadedRun++;
          checkAndStart();
        };
        img.src = src;
        runImages.push(img);
      });
    };

    const startAnimation = () => {
      if (isAnimationRunning) return;

      // Проверяем, что есть хотя бы одна загруженная анимация
      if (idleImages.length === 0 && runImages.length === 0) {
        console.warn('No images loaded, cannot start animation');
        return;
      }

      console.log('Starting animation', {
        idleImages: idleImages.length,
        runImages: runImages.length,
      });
      isAnimationRunning = true;
      lastFrameTimeRef.current = performance.now();
      frame = 0; // Сбрасываем кадр при старте

      const animate = (currentTime: number) => {
        if (!isAnimationRunning) return;

        // Используем refs вместо state для избежания задержек
        const currentAnimationType = animationTypeRef.current;
        const currentDirection = directionRef.current;

        const elapsed = currentTime - lastFrameTimeRef.current;

        if (elapsed >= FRAME_DELAY) {
          // Очищаем canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Определяем текущую анимацию
          const currentImages = currentAnimationType === 'run' ? runImages : idleImages;

          // Если текущая анимация не загружена, используем другую
          const imagesToUse =
            currentImages.length > 0
              ? currentImages
              : idleImages.length > 0
                ? idleImages
                : runImages;
          const maxFrames = imagesToUse.length;

          if (maxFrames > 0) {
            // Рисуем текущий кадр с зеркалированием
            if (imagesToUse[frame] && imagesToUse[frame].complete) {
              ctx.save();

              // Зеркалируем если направление влево
              if (currentDirection === 'left') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
              }

              ctx.drawImage(imagesToUse[frame], 0, 0, canvas.width, canvas.height);
              ctx.restore();
            }

            // Переходим к следующему кадру
            frame = (frame + 1) % maxFrames;
          }

          lastFrameTimeRef.current = currentTime;
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    loadImages();

    // Очистка при размонтировании
    return () => {
      isAnimationRunning = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      idleImages = [];
      runImages = [];
    };
  }, []); // Убираем зависимости для избежания пересоздания

  // Обработка клавиатуры и перемещения
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        pressedKeysRef.current.add(e.key);
        updateAnimation();
        startMovement();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        pressedKeysRef.current.delete(e.key);
        updateAnimation();
        if (pressedKeysRef.current.size === 0) {
          stopMovement();
        }
      }
    };

    const updateAnimation = () => {
      const hasRight = pressedKeysRef.current.has('ArrowRight');
      const hasLeft = pressedKeysRef.current.has('ArrowLeft');

      if (hasRight || hasLeft) {
        animationTypeRef.current = 'run';
        directionRef.current = hasRight ? 'right' : 'left';
      } else {
        animationTypeRef.current = 'idle';
      }
    };

    const BOUNDS_UPDATE_INTERVAL = 100; // Обновляем размеры раз в 100мс

    const updateBounds = () => {
      const container = containerRef.current?.parentElement;
      if (!container || !containerRef.current) return;

      const now = performance.now();
      if (now - lastBoundsUpdateRef.current < BOUNDS_UPDATE_INTERVAL) {
        return; // Используем кешированные значения
      }

      const containerRect = container.getBoundingClientRect();
      const canvasWidth = containerRef.current.offsetWidth || 300;
      const maxX = Math.max(0, containerRect.width - canvasWidth);

      containerBoundsRef.current = {
        width: containerRect.width,
        canvasWidth,
        maxX,
      };
      lastBoundsUpdateRef.current = now;
    };

    const startMovement = () => {
      if (!containerRef.current || moveTweenRef.current) return;

      const updateMovement = () => {
        const hasRight = pressedKeysRef.current.has('ArrowRight');
        const hasLeft = pressedKeysRef.current.has('ArrowLeft');

        if (!hasRight && !hasLeft) {
          stopMovement();
          return;
        }

        if (!containerRef.current) return;

        // Обновляем размеры только при необходимости
        updateBounds();

        const currentX = (gsap.getProperty(containerRef.current, 'x') as number) || 0;
        let targetX = currentX;

        if (hasRight) {
          targetX = Math.min(currentX + MOVE_SPEED, containerBoundsRef.current.maxX);
        } else if (hasLeft) {
          targetX = Math.max(currentX - MOVE_SPEED, 0);
        }

        // Используем GSAP для плавного перемещения без ре-рендеров
        if (moveTweenRef.current) {
          moveTweenRef.current.kill();
        }

        moveTweenRef.current = gsap.to(containerRef.current, {
          x: targetX,
          duration: 0.05, // Уменьшаем duration для более отзывчивого управления
          ease: 'none',
          onComplete: () => {
            if (
              pressedKeysRef.current.has('ArrowRight') ||
              pressedKeysRef.current.has('ArrowLeft')
            ) {
              requestAnimationFrame(updateMovement);
            } else {
              moveTweenRef.current = null;
            }
          },
        });
      };

      requestAnimationFrame(updateMovement);
    };

    const stopMovement = () => {
      if (moveTweenRef.current) {
        moveTweenRef.current.kill();
        moveTweenRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopMovement();
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} width={300} height={200} />
    </div>
  );
};
