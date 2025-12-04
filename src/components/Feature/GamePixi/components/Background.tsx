import type { FC } from 'react';
import { Sprite, Assets, Texture } from 'pixi.js';
import type { Sprite as SpriteType } from 'pixi.js';
import { useExtend } from '@pixi/react';
import { useState, useEffect, useRef } from 'react';
import winterBgImage from '@assets/winter-bg.png';

const BACKGROUND_ASPECT_RATIO = 11121 / 1884; // Пропорции фона

type BackgroundProps = {
  windowSize: {
    width: number;
    height: number;
  };
  backgroundOffsetRef: React.MutableRefObject<number>;
  pressedKeysRef: React.MutableRefObject<Set<string>>;
  spriteXRef: React.MutableRefObject<number>;
  spriteSpeed: number;
  fixedPosition: number;
  onBackgroundLoaded?: () => void;
};

export const Background: FC<BackgroundProps> = ({
  windowSize,
  backgroundOffsetRef,
  pressedKeysRef,
  spriteXRef,
  spriteSpeed,
  fixedPosition,
  onBackgroundLoaded,
}) => {
  useExtend({ Sprite });

  const [backgroundTexture, setBackgroundTexture] = useState<Texture | null>(null);
  const backgroundRef1 = useRef<SpriteType | null>(null);
  const backgroundRef2 = useRef<SpriteType | null>(null);

  // Callback refs для сохранения ссылок на фоны
  const handleBackgroundRef1 = (sprite: SpriteType | null) => {
    backgroundRef1.current = sprite;
  };

  const handleBackgroundRef2 = (sprite: SpriteType | null) => {
    backgroundRef2.current = sprite;
  };

  // Загрузка фона
  useEffect(() => {
    const loadBackground = async () => {
      try {
        const texture = await Assets.load(winterBgImage);
        setBackgroundTexture(texture);
        // Уведомляем родительский компонент о загрузке фона
        if (onBackgroundLoaded) {
          onBackgroundLoaded();
        }
      } catch (error) {
        console.error('Failed to load background:', error);
        // Даже при ошибке уведомляем, чтобы лоадер не завис
        if (onBackgroundLoaded) {
          onBackgroundLoaded();
        }
      }
    };

    loadBackground();
  }, [onBackgroundLoaded]);

  // Обновление размеров фонов при изменении размера окна
  useEffect(() => {
    // Вычисляем ширину на основе высоты экрана, сохраняя пропорции
    const backgroundHeight = windowSize.height;
    const backgroundWidth = backgroundHeight * BACKGROUND_ASPECT_RATIO;

    if (backgroundRef1.current) {
      backgroundRef1.current.width = backgroundWidth;
      backgroundRef1.current.height = backgroundHeight;
    }
    if (backgroundRef2.current) {
      backgroundRef2.current.width = backgroundWidth;
      backgroundRef2.current.height = backgroundHeight;
    }
  }, [windowSize]);

  const animationFrameRef = useRef<number | null>(null);

  // Обновление позиций фонов в игровом цикле
  useEffect(() => {
    let lastTime = performance.now();
    const targetFPS = 60; // Целевой FPS
    const frameTime = 1000 / targetFPS; // Время одного кадра в миллисекундах

    const updateBackground = () => {
      if (backgroundRef1.current && backgroundRef2.current) {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Нормализуем delta time относительно целевого FPS
        const normalizedDelta = Math.min(deltaTime / frameTime, 2);

        // Проверяем, нужно ли двигать фон
        const shouldMoveBackground =
          pressedKeysRef.current.has('ArrowRight') && spriteXRef.current >= fixedPosition;

        // Двигаем фон если герой зафиксирован и движется вправо
        // Скорость фона должна быть равна скорости героя для синхронизации
        if (shouldMoveBackground) {
          backgroundOffsetRef.current -= spriteSpeed * normalizedDelta;
        }

        // Используем реальную ширину фона с учетом пропорций
        const bgWidth = windowSize.height * BACKGROUND_ASPECT_RATIO;
        const offset = backgroundOffsetRef.current;

        // Позиция первого фона
        let bg1X = offset % (bgWidth * 2);
        if (bg1X > 0) {
          bg1X -= bgWidth * 2;
        }
        backgroundRef1.current.x = bg1X;

        // Позиция второго фона (следующий за первым)
        let bg2X = bg1X + bgWidth;
        if (bg2X > bgWidth) {
          bg2X -= bgWidth * 2;
        }
        backgroundRef2.current.x = bg2X;

        // Когда фон уходит за левую границу, перемещаем его вправо
        if (backgroundRef1.current.x + bgWidth < 0) {
          backgroundRef1.current.x = backgroundRef2.current.x + bgWidth;
        }
        if (backgroundRef2.current.x + bgWidth < 0) {
          backgroundRef2.current.x = backgroundRef1.current.x + bgWidth;
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateBackground);
    };

    animationFrameRef.current = requestAnimationFrame(updateBackground);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [windowSize, backgroundOffsetRef, pressedKeysRef, spriteXRef, spriteSpeed, fixedPosition]);

  if (!backgroundTexture) {
    return null;
  }

  const backgroundWidth = windowSize.height * BACKGROUND_ASPECT_RATIO;
  const backgroundHeight = windowSize.height;

  return (
    <>
      <pixiSprite
        ref={handleBackgroundRef1}
        texture={backgroundTexture}
        x={0}
        y={0}
        width={backgroundWidth}
        height={backgroundHeight}
        anchor={0}
        zIndex={0}
      />
      <pixiSprite
        ref={handleBackgroundRef2}
        texture={backgroundTexture}
        x={backgroundWidth}
        y={0}
        width={backgroundWidth}
        height={backgroundHeight}
        anchor={0}
        zIndex={0}
      />
    </>
  );
};
