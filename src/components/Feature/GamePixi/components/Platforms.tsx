import type { FC } from 'react';
import { Sprite, Assets, Texture } from 'pixi.js';
import type { Sprite as SpriteType } from 'pixi.js';
import { useExtend } from '@pixi/react';
import { useState, useEffect, useRef } from 'react';
import platformImage1 from '@assets/platforms/image-1.png';
import platformImage2 from '@assets/platforms/image-2.png';
import platformImage4 from '@assets/platforms/image-4.png';
import platformImage5 from '@assets/platforms/image-5.png';
import platformImage6 from '@assets/platforms/image-6.png';

export type PlatformData = {
  id: number;
  x: number; // Позиция относительно начального фона (без учета offset)
  y: number;
  width: number;
  textureIndex: number; // Индекс текстуры из массива платформ
};

type PlatformsProps = {
  windowSize: {
    width: number;
    height: number;
  };
  backgroundOffsetRef: React.MutableRefObject<number>;
  platformsRef: React.MutableRefObject<PlatformData[]>;
};

const PLATFORM_HEIGHT = 50; // Высота платформы
const MIN_PLATFORM_WIDTH = 150;
const MAX_PLATFORM_WIDTH = 250;
const MIN_PLATFORM_DISTANCE = 50; // Минимальное расстояние между платформами
const MAX_PLATFORM_DISTANCE = 150; // Максимальное расстояние между платформами
const PLATFORM_GENERATION_DISTANCE = 1000; // Расстояние справа от экрана, где генерируются новые платформы
const MIN_PLATFORM_Y = 450; // Минимальная высота платформы
const MAX_PLATFORM_Y = 550; // Максимальная высота платформы
const HERO_START_X = 200; // Начальная позиция героя по X
const HERO_GROUND_Y = 470; // Высота земли, на которой стоит герой

// Массив путей к изображениям платформ
const PLATFORM_IMAGES = [
  platformImage1,
  platformImage2,
  platformImage4,
  platformImage5,
  platformImage6,
];

export const Platforms: FC<PlatformsProps> = ({
  windowSize,
  backgroundOffsetRef,
  platformsRef,
}) => {
  useExtend({ Sprite });

  const [platformTextures, setPlatformTextures] = useState<Texture[]>([]);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const platformRefs = useRef<Map<number, SpriteType | null>>(new Map());
  const nextPlatformId = useRef(0);
  const lastGeneratedX = useRef(0);

  // Генерация случайной платформы
  const generatePlatform = (startX: number): PlatformData => {
    const width =
      Math.floor(Math.random() * (MAX_PLATFORM_WIDTH - MIN_PLATFORM_WIDTH + 1)) +
      MIN_PLATFORM_WIDTH;
    const distance =
      Math.floor(Math.random() * (MAX_PLATFORM_DISTANCE - MIN_PLATFORM_DISTANCE + 1)) +
      MIN_PLATFORM_DISTANCE;
    const x = startX + distance;
    const y = Math.floor(Math.random() * (MAX_PLATFORM_Y - MIN_PLATFORM_Y + 1)) + MIN_PLATFORM_Y;
    // Случайно выбираем текстуру из доступных
    const textureIndex = Math.floor(Math.random() * PLATFORM_IMAGES.length);

    return {
      id: nextPlatformId.current++,
      x,
      y,
      width,
      textureIndex,
    };
  };

  // Инициализация начальных платформ
  useEffect(() => {
    if (platforms.length === 0) {
      const initialPlatforms: PlatformData[] = [];

      // Первая платформа всегда под героем
      const firstPlatformWidth = 200;
      const firstPlatformX = HERO_START_X - firstPlatformWidth / 2; // Центрируем под героем
      const firstPlatform: PlatformData = {
        id: nextPlatformId.current++,
        x: firstPlatformX,
        y: HERO_GROUND_Y, // На уровне земли, где стоит герой
        width: firstPlatformWidth,
        textureIndex: Math.floor(Math.random() * PLATFORM_IMAGES.length), // Случайная текстура для первой платформы
      };
      initialPlatforms.push(firstPlatform);

      // Генерируем остальные платформы, начиная с позиции после первой
      let currentX = firstPlatformX + firstPlatformWidth;
      for (let i = 0; i < 9; i++) {
        const platform = generatePlatform(currentX);
        initialPlatforms.push(platform);
        currentX = platform.x + platform.width;
        lastGeneratedX.current = currentX;
      }

      platformsRef.current = initialPlatforms;
      // Используем requestAnimationFrame для асинхронного обновления состояния
      requestAnimationFrame(() => {
        setPlatforms(initialPlatforms);
      });
    }
  }, [platforms.length, platformsRef]);

  // Загрузка всех текстур платформ
  useEffect(() => {
    const loadPlatformTextures = async () => {
      try {
        const textures = await Promise.all(
          PLATFORM_IMAGES.map((imagePath) => Assets.load(imagePath))
        );
        setPlatformTextures(textures);
      } catch (error) {
        console.error('Failed to load platform textures:', error);
      }
    };

    loadPlatformTextures();
  }, []);

  // Callback refs для сохранения ссылок на платформы
  const handlePlatformRef = (id: number) => (sprite: SpriteType | null) => {
    if (sprite) {
      platformRefs.current.set(id, sprite);
    } else {
      platformRefs.current.delete(id);
    }
  };

  // Синхронизация ref с состоянием
  useEffect(() => {
    platformsRef.current = platforms;
  }, [platforms, platformsRef]);

  // Обновление позиций платформ в игровом цикле
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const updatePlatforms = () => {
      const currentPlatforms = platforms;
      if (currentPlatforms.length === 0 || platformTextures.length === 0) {
        animationFrameRef.current = requestAnimationFrame(updatePlatforms);
        return;
      }

      // Используем тот же offset, который обновляется в Background
      const offset = backgroundOffsetRef.current;

      // Находим самую правую видимую позицию платформы
      let rightmostX = -Infinity;
      let rightmostPlatformId = -1;

      // Обновляем позиции всех платформ и находим самую правую
      currentPlatforms.forEach((platform) => {
        const platformRef = platformRefs.current.get(platform.id);
        if (platformRef) {
          // Позиция платформы синхронизирована с движением фона
          const screenX = platform.x + offset;
          platformRef.x = screenX;
          platformRef.y = platform.y;

          // Находим самую правую платформу
          if (screenX > rightmostX) {
            rightmostX = screenX;
            rightmostPlatformId = platform.id;
          }
        }
      });

      // Удаляем платформы, которые ушли за левую границу экрана
      const filteredPlatforms = currentPlatforms.filter((platform) => {
        const screenX = platform.x + offset;
        return screenX + platform.width >= -100; // Удаляем только если полностью ушла за экран с запасом
      });

      // Генерируем новые платформы, если самая правая платформа близко к правому краю экрана
      const rightmostPlatform = filteredPlatforms.find((p) => p.id === rightmostPlatformId);
      const newPlatforms = [...filteredPlatforms];

      if (rightmostPlatform) {
        const rightmostScreenX = rightmostPlatform.x + offset;
        const rightmostEndX = rightmostScreenX + rightmostPlatform.width;

        // Если самая правая платформа находится в пределах области генерации справа от экрана
        if (rightmostEndX < windowSize.width + PLATFORM_GENERATION_DISTANCE) {
          let currentX = lastGeneratedX.current;

          // Генерируем платформы, пока не покроем область генерации
          while (currentX + offset < windowSize.width + PLATFORM_GENERATION_DISTANCE) {
            const newPlatform = generatePlatform(currentX);
            newPlatforms.push(newPlatform);
            currentX = newPlatform.x + newPlatform.width;
            lastGeneratedX.current = currentX;
          }
        }
      }

      // Обновляем состояние только если есть изменения
      if (newPlatforms.length !== currentPlatforms.length) {
        setPlatforms(newPlatforms);
        platformsRef.current = newPlatforms;
      }

      animationFrameRef.current = requestAnimationFrame(updatePlatforms);
    };

    animationFrameRef.current = requestAnimationFrame(updatePlatforms);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [platformTextures, backgroundOffsetRef, windowSize.width, platforms, platformsRef]);

  if (platformTextures.length === 0 || platforms.length === 0) {
    return null;
  }

  return (
    <>
      {platforms.map((platform) => {
        // console.log('platform:', platform);
        const texture = platformTextures[platform.textureIndex];
        if (!texture) return null;

        return (
          <pixiSprite
            key={platform.id}
            ref={handlePlatformRef(platform.id)}
            texture={texture}
            x={platform.x}
            y={platform.y}
            width={platform.width}
            height={PLATFORM_HEIGHT}
            anchor={{ x: 0, y: -0.6 }}
            zIndex={1}
          />
        );
      })}
    </>
  );
};
