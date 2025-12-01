import type { FC } from 'react';
import { useExtend } from '@pixi/react';
import { Assets, Texture, Spritesheet, AnimatedSprite } from 'pixi.js';
import type { AnimatedSprite as AnimatedSpriteType } from 'pixi.js';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import idleAnimationJsonUrl from '@assets/animations/idle/idle.json?url';
import runAnimationJsonUrl from '@assets/animations/run/run.json?url';
import jumpAnimationJsonUrl from '@assets/animations/jump/jump.json?url';
import idleTextureUrl from '@assets/animations/idle/texture.png';
import runTextureUrl from '@assets/animations/run/texture.png';
import jumpTextureUrl from '@assets/animations/jump/texture.png';
import jumpSoundUrl from '@assets/sounds/jump.mp3';

const SPRITE_SCALE = 0.3;
const SPRITE_SPEED = 5;
const JUMP_POWER = 20;
const GRAVITY = 0.8;
const GROUND_Y = 400;
const HERO_WIDTH = 50; // Примерная ширина героя (можно настроить)
const HERO_HEIGHT = 80; // Примерная высота героя (можно настроить)

type HeroProps = {
  windowSize: {
    width: number;
    height: number;
  };
  pressedKeysRef: React.MutableRefObject<Set<string>>;
  spriteXRef: React.MutableRefObject<number>;
  platformsRef: React.MutableRefObject<Array<{ id: number; x: number; y: number; width: number }>>;
  backgroundOffsetRef: React.MutableRefObject<number>;
  onMove: () => void;
  onGameOver: () => void;
};

export const Hero: FC<HeroProps> = ({
  windowSize,
  pressedKeysRef,
  spriteXRef,
  platformsRef,
  backgroundOffsetRef,
  onMove,
  onGameOver,
}) => {
  useExtend({ AnimatedSprite });

  const [idleTextures, setIdleTextures] = useState<Texture[] | null>(null);
  const [runTextures, setRunTextures] = useState<Texture[] | null>(null);
  const [jumpTextures, setJumpTextures] = useState<Texture[] | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [spriteX, setSpriteX] = useState(200);
  const [spriteY, setSpriteY] = useState(GROUND_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const spriteRef = useRef<AnimatedSpriteType | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const velocityYRef = useRef(0);
  const spriteYRef = useRef(GROUND_Y);
  const gameOverCalledRef = useRef(false);
  const jumpSoundRef = useRef<HTMLAudioElement | null>(null);

  // Загрузка звука прыжка
  useEffect(() => {
    jumpSoundRef.current = new Audio(jumpSoundUrl);
    jumpSoundRef.current.volume = 0.5; // Устанавливаем громкость (0.0 - 1.0)
    jumpSoundRef.current.preload = 'auto';

    return () => {
      if (jumpSoundRef.current) {
        jumpSoundRef.current.pause();
        jumpSoundRef.current = null;
      }
    };
  }, []);

  // Загрузка анимаций
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        // Загружаем idle анимацию
        const [idleJsonData, idleTexture] = await Promise.all([
          fetch(idleAnimationJsonUrl).then((res) => res.json()),
          Assets.load(idleTextureUrl),
        ]);
        idleJsonData.meta.image = idleTextureUrl;
        const idleSheet = new Spritesheet(idleTexture, idleJsonData);
        await idleSheet.parse();
        let idleAnimationTextures: Texture[] | undefined;

        if (idleSheet.animations && Object.keys(idleSheet.animations).length > 0) {
          const key = idleSheet.animations['idle'] ? 'idle' : Object.keys(idleSheet.animations)[0];
          idleAnimationTextures = idleSheet.animations[key];
        }

        if (!idleAnimationTextures) {
          const sortedKeys = Object.keys(idleSheet.textures || {}).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });

          idleAnimationTextures = sortedKeys
            .map((key) => idleSheet.textures[key])
            .filter((t): t is Texture => !!t);
        }

        if (idleAnimationTextures.length > 0) {
          setIdleTextures(idleAnimationTextures);
        }

        // Загружаем run анимацию
        const [runJsonData, runTexture] = await Promise.all([
          fetch(runAnimationJsonUrl).then((res) => res.json()),
          Assets.load(runTextureUrl),
        ]);
        runJsonData.meta.image = runTextureUrl;
        const runSheet = new Spritesheet(runTexture, runJsonData);
        await runSheet.parse();
        let runAnimationTextures: Texture[] | undefined;

        if (runSheet.animations && Object.keys(runSheet.animations).length > 0) {
          const key = runSheet.animations['run'] ? 'run' : Object.keys(runSheet.animations)[0];
          runAnimationTextures = runSheet.animations[key];
        }

        if (!runAnimationTextures) {
          const sortedKeys = Object.keys(runSheet.textures || {}).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });

          runAnimationTextures = sortedKeys
            .map((key) => runSheet.textures[key])
            .filter((t): t is Texture => !!t);
        }

        if (runAnimationTextures.length > 0) {
          setRunTextures(runAnimationTextures);
        }

        // Загружаем jump анимацию
        const [jumpJsonData, jumpTexture] = await Promise.all([
          fetch(jumpAnimationJsonUrl).then((res) => res.json()),
          Assets.load(jumpTextureUrl),
        ]);
        jumpJsonData.meta.image = jumpTextureUrl;
        const jumpSheet = new Spritesheet(jumpTexture, jumpJsonData);
        await jumpSheet.parse();
        let jumpAnimationTextures: Texture[] | undefined;

        if (jumpSheet.animations && Object.keys(jumpSheet.animations).length > 0) {
          const key = jumpSheet.animations['jump'] ? 'jump' : Object.keys(jumpSheet.animations)[0];
          jumpAnimationTextures = jumpSheet.animations[key];
        }

        if (!jumpAnimationTextures) {
          const sortedKeys = Object.keys(jumpSheet.textures || {}).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });

          jumpAnimationTextures = sortedKeys
            .map((key) => jumpSheet.textures[key])
            .filter((t): t is Texture => !!t);
        }

        if (jumpAnimationTextures.length > 0) {
          setJumpTextures(jumpAnimationTextures);
        }
      } catch (error) {
        console.error('Failed to load animations:', error);
      }
    };

    loadAnimations();
  }, []);

  // Callback ref для сохранения ссылки на sprite
  const handleAnimatedSpriteRef = (sprite: AnimatedSpriteType | null) => {
    spriteRef.current = sprite;
  };

  // Вычисляем текущие текстуры на основе состояния
  const currentTextures = useMemo(() => {
    // Приоритет: прыжок > бег > покой
    if (isJumping && jumpTextures && jumpTextures.length > 0) {
      return jumpTextures;
    }
    if (isMoving && runTextures && runTextures.length > 0) {
      return runTextures;
    }
    if (idleTextures && idleTextures.length > 0) {
      return idleTextures;
    }
    // Возвращаем первую доступную анимацию
    return jumpTextures || runTextures || idleTextures || null;
  }, [isMoving, isJumping, idleTextures, runTextures, jumpTextures]);

  // Обновляем текстуры спрайта при изменении currentTextures
  useEffect(() => {
    if (spriteRef.current && currentTextures && currentTextures.length > 0) {
      const timeoutId = setTimeout(() => {
        if (spriteRef.current && currentTextures) {
          spriteRef.current.textures = currentTextures;
          spriteRef.current.loop = true;
          spriteRef.current.animationSpeed = 0.4;
          spriteRef.current.play();
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [currentTextures]);

  // Зеркалируем спрайт в зависимости от направления
  useEffect(() => {
    if (spriteRef.current) {
      spriteRef.current.scale.x = direction === 'left' ? -SPRITE_SCALE : SPRITE_SCALE;
    }
  }, [direction]);

  // Синхронизируем refs с состоянием
  useEffect(() => {
    velocityYRef.current = velocityY;
  }, [velocityY]);

  useEffect(() => {
    spriteYRef.current = spriteY;
  }, [spriteY]);

  useEffect(() => {
    spriteXRef.current = spriteX;
  }, [spriteX, spriteXRef]);

  // Функция проверки коллизии с платформами
  const checkPlatformCollision = useCallback(
    (
      heroX: number,
      heroY: number,
      heroWidth: number,
      heroHeight: number
    ): { onPlatform: boolean; platformY: number | null } => {
      const offset = backgroundOffsetRef.current;
      const platforms = platformsRef.current;

      // Проверяем коллизию с каждой платформой
      for (const platform of platforms) {
        const platformScreenX = platform.x + offset;
        const platformScreenY = platform.y;

        // Проверяем, находится ли герой над платформой по X
        const heroLeft = heroX - heroWidth / 2;
        const heroRight = heroX + heroWidth / 2;
        const platformLeft = platformScreenX;
        const platformRight = platformScreenX + platform.width;

        if (heroRight > platformLeft && heroLeft < platformRight) {
          // Герой находится над платформой по X
          // Проверяем, касается ли герой платформы сверху
          const heroBottom = heroY + heroHeight / 2;
          const platformTop = platformScreenY;

          // Если герой падает вниз и его нижняя часть находится на уровне или чуть выше платформы
          if (
            velocityYRef.current >= 0 &&
            heroBottom >= platformTop - 5 &&
            heroBottom <= platformTop + 20
          ) {
            return {
              onPlatform: true,
              platformY: platformTop - heroHeight / 2,
            };
          }
        }
      }

      return { onPlatform: false, platformY: null };
    },
    [backgroundOffsetRef, platformsRef]
  );

  // Физика и игровой цикл
  useEffect(() => {
    const updatePhysics = () => {
      // Применяем гравитацию
      velocityYRef.current += GRAVITY;

      // Обновляем позицию Y
      spriteYRef.current += velocityYRef.current;

      // Проверяем коллизию с платформами
      const collision = checkPlatformCollision(
        spriteXRef.current,
        spriteYRef.current,
        HERO_WIDTH,
        HERO_HEIGHT
      );

      if (collision.onPlatform && collision.platformY !== null) {
        // Герой стоит на платформе
        spriteYRef.current = collision.platformY;
        velocityYRef.current = 0;
        setIsJumping(false);
      } else {
        // Проверяем, упал ли герой ниже сцены
        if (spriteYRef.current > windowSize.height + 100 && !gameOverCalledRef.current) {
          // Герой упал ниже экрана - игра окончена
          gameOverCalledRef.current = true;
          setTimeout(() => {
            onGameOver();
          }, 600);
        }
      }

      // Обновляем состояние
      setSpriteY(spriteYRef.current);
      setVelocityY(velocityYRef.current);

      const fixedPosition = windowSize.width * 0.4;

      // Непрерывное движение по X при удержании клавиш
      if (pressedKeysRef.current.has('ArrowLeft')) {
        const newX = spriteXRef.current - SPRITE_SPEED;
        // Если герой был зафиксирован и движется назад, разрешаем движение
        if (newX < fixedPosition) {
          spriteXRef.current = Math.max(0, newX);
          setSpriteX(spriteXRef.current);
        }
      }
      if (pressedKeysRef.current.has('ArrowRight')) {
        const newX = spriteXRef.current + SPRITE_SPEED;
        // Если достигли 40% ширины, фиксируем позицию
        if (newX >= fixedPosition) {
          spriteXRef.current = fixedPosition;
          setSpriteX(fixedPosition);
          // Вызываем onMove когда герой движется вперед (даже при фиксированной позиции)
          onMove();
        } else {
          if (typeof window !== 'undefined') {
            spriteXRef.current = Math.min(window.innerWidth, newX);
          } else {
            spriteXRef.current = newX;
          }

          setSpriteX(spriteXRef.current);
          // Вызываем onMove когда герой движется вперед
          onMove();
        }
      }

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    windowSize.width,
    windowSize.height,
    spriteX,
    pressedKeysRef,
    spriteXRef,
    platformsRef,
    backgroundOffsetRef,
    checkPlatformCollision,
    onMove,
    onGameOver,
  ]);

  // Обработка нажатий клавиш стрелок
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        // Прыжок только если персонаж на платформе или на земле
        const collision = checkPlatformCollision(
          spriteXRef.current,
          spriteYRef.current,
          HERO_WIDTH,
          HERO_HEIGHT
        );
        const isOnGround = spriteYRef.current >= GROUND_Y - 1;

        if (!isJumping && (collision.onPlatform || isOnGround)) {
          setIsJumping(true);
          velocityYRef.current = -JUMP_POWER;
          setVelocityY(-JUMP_POWER);
          // Воспроизводим звук прыжка
          if (jumpSoundRef.current) {
            jumpSoundRef.current.currentTime = 0; // Сбрасываем на начало
            jumpSoundRef.current.play().catch((error) => {
              console.warn('Failed to play jump sound:', error);
            });
          }
        }
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (!pressedKeysRef.current.has(event.key)) {
          pressedKeysRef.current.add(event.key);
          setIsMoving(true);

          if (event.key === 'ArrowLeft') {
            setDirection('left');
          } else if (event.key === 'ArrowRight') {
            setDirection('right');
          }
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        pressedKeysRef.current.delete(event.key);
        // Если больше нет нажатых стрелок, останавливаем движение
        if (pressedKeysRef.current.size === 0) {
          setIsMoving(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [
    isJumping,
    pressedKeysRef,
    platformsRef,
    backgroundOffsetRef,
    spriteXRef,
    checkPlatformCollision,
  ]);

  if (!currentTextures || currentTextures.length === 0) {
    return null;
  }

  return (
    <pixiAnimatedSprite
      ref={handleAnimatedSpriteRef}
      textures={currentTextures}
      loop={true}
      animationSpeed={0.4}
      anchor={0.5}
      x={spriteX}
      y={spriteY}
      scale={0.3}
      zIndex={2}
    />
  );
};
