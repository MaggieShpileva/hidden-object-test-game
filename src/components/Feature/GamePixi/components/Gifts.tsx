import type { FC } from 'react';
import { Sprite, Assets, Texture } from 'pixi.js';
import type { Sprite as SpriteType } from 'pixi.js';
import { useExtend } from '@pixi/react';
import { useState, useEffect, useRef } from 'react';
import cake1Image from '@assets/gifts/cake-1.png';
import candy1Image from '@assets/gifts/candy-1.png';
import gift1Image from '@assets/gifts/gift-1.png';
import gift2Image from '@assets/gifts/gift-2.png';
import gitf3Image from '@assets/gifts/gitf-3.png';
import gitf4Image from '@assets/gifts/gitf-4.png';

export type GiftData = {
  id: number;
  x: number; // Позиция относительно начального фона (без учета offset)
  y: number;
  width: number; // Ширина с учетом пропорций
  height: number; // Высота с учетом пропорций
  textureIndex: number; // Индекс текстуры из массива подарков
};

type GiftsProps = {
  windowSize: {
    width: number;
    height: number;
  };
  backgroundOffsetRef: React.MutableRefObject<number>;
  giftsRef: React.MutableRefObject<GiftData[]>;
  collectedGiftsRef: React.MutableRefObject<Set<number>>;
};

const GIFT_SIZE = 100; // Размер подарка
const MIN_GIFT_DISTANCE = 500; // Минимальное расстояние между подарками
const MAX_GIFT_DISTANCE = 800; // Максимальное расстояние между подарками
const GIFT_GENERATION_DISTANCE = 1000; // Расстояние справа от экрана, где генерируются новые подарки
const MIN_GIFT_Y = 250; // Минимальная высота подарка (намного выше платформ)
const MAX_GIFT_Y = 400; // Максимальная высота подарка

// Массив путей к изображениям подарков
const GIFT_IMAGES = [cake1Image, candy1Image, gift1Image, gift2Image, gitf3Image, gitf4Image];

export const Gifts: FC<GiftsProps> = ({
  windowSize,
  backgroundOffsetRef,
  giftsRef,
  collectedGiftsRef,
}) => {
  useExtend({ Sprite });

  const [giftTextures, setGiftTextures] = useState<Texture[]>([]);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const giftRefs = useRef<Map<number, SpriteType | null>>(new Map());
  const nextGiftId = useRef(0);
  const lastGeneratedX = useRef(0);

  // Генерация случайного подарка
  const generateGift = (startX: number, textures: Texture[]): GiftData => {
    const distance =
      Math.floor(Math.random() * (MAX_GIFT_DISTANCE - MIN_GIFT_DISTANCE + 1)) + MIN_GIFT_DISTANCE;
    const x = startX + distance;
    const y = Math.floor(Math.random() * (MAX_GIFT_Y - MIN_GIFT_Y + 1)) + MIN_GIFT_Y;
    // Случайно выбираем текстуру из доступных
    const textureIndex = Math.floor(Math.random() * GIFT_IMAGES.length);
    const texture = textures[textureIndex];

    // Вычисляем размеры с учетом пропорций текстуры
    let width = GIFT_SIZE;
    let height = GIFT_SIZE;

    if (texture) {
      const textureWidth = texture.width;
      const textureHeight = texture.height;
      const aspectRatio = textureWidth / textureHeight;

      if (aspectRatio > 1) {
        // Ширина больше высоты - ограничиваем по ширине
        height = GIFT_SIZE / aspectRatio;
      } else {
        // Высота больше ширины - ограничиваем по высоте
        width = GIFT_SIZE * aspectRatio;
      }
    }

    return {
      id: nextGiftId.current++,
      x,
      y,
      width,
      height,
      textureIndex,
    };
  };

  // Инициализация начальных подарков
  useEffect(() => {
    if (gifts.length === 0 && giftTextures.length > 0) {
      const initialGifts: GiftData[] = [];

      // Генерируем подарки, начиная с позиции после старта
      let currentX = 500; // Начинаем генерацию после начальной позиции
      for (let i = 0; i < 10; i++) {
        const gift = generateGift(currentX, giftTextures);
        initialGifts.push(gift);
        currentX = gift.x + gift.width;
        lastGeneratedX.current = currentX;
      }

      giftsRef.current = initialGifts;
      // Используем requestAnimationFrame для асинхронного обновления состояния
      requestAnimationFrame(() => {
        setGifts(initialGifts);
      });
    }
  }, [gifts.length, giftsRef, giftTextures]);

  // Загрузка текстур подарков
  useEffect(() => {
    const loadGifts = async () => {
      try {
        const textures = await Promise.all(GIFT_IMAGES.map((image) => Assets.load(image)));
        setGiftTextures(textures);
      } catch (error) {
        console.error('Failed to load gift textures:', error);
      }
    };

    loadGifts();
  }, []);

  // Callback refs для сохранения ссылок на подарки
  const handleGiftRef = (id: number) => (sprite: SpriteType | null) => {
    if (sprite) {
      giftRefs.current.set(id, sprite);
    } else {
      giftRefs.current.delete(id);
    }
  };

  // Синхронизация ref с состоянием
  useEffect(() => {
    giftsRef.current = gifts;
  }, [gifts, giftsRef]);

  // Синхронизация состояния с giftsRef (только для новых подарков, не для удаления)
  // Удаление происходит визуально через скрытие, без обновления состояния
  useEffect(() => {
    const refGifts = giftsRef.current;
    const currentGiftIds = new Set(gifts.map((g) => g.id));

    // Обновляем только если есть новые подарки (не удаление)
    const hasNewGifts = refGifts.some((g) => !currentGiftIds.has(g.id));
    if (hasNewGifts && refGifts.length > gifts.length) {
      setGifts(refGifts);
    }
  }, [gifts, giftsRef]);

  // Обновление позиций подарков в игровом цикле
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateGifts = () => {
      const currentGifts = gifts;
      if (currentGifts.length === 0 || !giftTextures) {
        animationFrameRef.current = requestAnimationFrame(updateGifts);
        return;
      }

      // Используем тот же offset, который обновляется в Background
      const offset = backgroundOffsetRef.current;

      // Находим самую правую видимую позицию подарка
      let rightmostX = -Infinity;
      let rightmostGiftId = -1;

      // Синхронизируем с giftsRef (на случай, если подарки были удалены извне)
      // Синхронизация происходит через отдельный useEffect, здесь просто пропускаем обновление
      const refGifts = giftsRef.current;
      if (refGifts.length !== currentGifts.length) {
        // Пропускаем этот кадр, синхронизация произойдет в useEffect
        animationFrameRef.current = requestAnimationFrame(updateGifts);
        return;
      }

      // Обновляем позиции всех подарков и находим самую правую
      currentGifts.forEach((gift) => {
        const giftRef = giftRefs.current.get(gift.id);
        if (giftRef) {
          // Проверяем, собран ли подарок - если да, скрываем его
          const isCollected = collectedGiftsRef.current.has(gift.id);
          giftRef.visible = !isCollected;
          giftRef.alpha = isCollected ? 0 : 1;

          if (!isCollected) {
            // Позиция подарка синхронизирована с движением фона
            const screenX = gift.x + offset;
            giftRef.x = screenX;
            giftRef.y = gift.y;

            // Обновляем вращение (колебание слева направо)
            // Используем gift.id для уникальной фазы каждого подарка
            const time = Date.now() * 0.001;
            const rotation = Math.sin(time * 3 + gift.id) * 0.3; // Амплитуда 0.3 радиан (~17 градусов), скорость увеличена в 3 раза
            giftRef.rotation = rotation;

            // Находим самую правую подарок
            if (screenX > rightmostX) {
              rightmostX = screenX;
              rightmostGiftId = gift.id;
            }
          }
        }
      });

      // Удаляем подарки, которые ушли за левую границу экрана
      // Собранные подарки скрываются визуально, но остаются в массиве до ухода за экран
      const filteredGifts = currentGifts.filter((gift) => {
        const screenX = gift.x + offset;
        const isOffScreen = screenX + gift.width < -100;
        const isCollected = collectedGiftsRef.current.has(gift.id);
        // Удаляем только если ушел за экран И был собран (или просто ушел за экран)
        return !isOffScreen || !isCollected;
      });

      // Генерируем новые подарки, если самая правая подарок близко к правому краю экрана
      const rightmostGift = filteredGifts.find((g) => g.id === rightmostGiftId);
      const newGifts = [...filteredGifts];

      if (rightmostGift) {
        const rightmostScreenX = rightmostGift.x + offset;
        const rightmostEndX = rightmostScreenX + rightmostGift.width;

        // Если самая правая подарок находится в пределах области генерации справа от экрана
        if (rightmostEndX < windowSize.width + GIFT_GENERATION_DISTANCE) {
          let currentX = lastGeneratedX.current;

          // Генерируем подарки, пока не покроем область генерации
          while (currentX + offset < windowSize.width + GIFT_GENERATION_DISTANCE) {
            const newGift = generateGift(currentX, giftTextures);
            newGifts.push(newGift);
            currentX = newGift.x + newGift.width;
            lastGeneratedX.current = currentX;
          }
        }
      }

      // Обновляем состояние только если есть изменения
      if (newGifts.length !== currentGifts.length) {
        setGifts(newGifts);
        giftsRef.current = newGifts;
      }

      animationFrameRef.current = requestAnimationFrame(updateGifts);
    };

    animationFrameRef.current = requestAnimationFrame(updateGifts);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [giftTextures, backgroundOffsetRef, windowSize.width, gifts, giftsRef, collectedGiftsRef]);

  if (!giftTextures || gifts.length === 0) {
    return null;
  }

  return (
    <>
      {gifts.map((gift) => {
        const texture = giftTextures[gift.textureIndex];
        if (!texture) return null;

        // Вычисляем масштаб, сохраняя пропорции изображения
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        const aspectRatio = textureWidth / textureHeight;

        // Используем GIFT_SIZE как максимальный размер, сохраняя пропорции
        let width = GIFT_SIZE;
        let height = GIFT_SIZE;

        if (aspectRatio > 1) {
          // Ширина больше высоты - ограничиваем по ширине
          height = GIFT_SIZE / aspectRatio;
        } else {
          // Высота больше ширины - ограничиваем по высоте
          width = GIFT_SIZE * aspectRatio;
        }

        return (
          <pixiSprite
            key={gift.id}
            ref={handleGiftRef(gift.id)}
            texture={texture}
            x={gift.x}
            y={gift.y}
            width={width}
            height={height}
            anchor={0.5}
            zIndex={1}
          />
        );
      })}
    </>
  );
};
