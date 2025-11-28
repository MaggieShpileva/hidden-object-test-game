import type { FC } from 'react';
import { Application, useExtend } from '@pixi/react';
import { Container, Graphics, Sprite, Assets, AnimatedSprite, Texture, Spritesheet } from 'pixi.js';
import type { AnimatedSprite as AnimatedSpriteType } from 'pixi.js';
import type { Sprite as SpriteType } from 'pixi.js';
import styles from './GamePixi.module.scss';
import { useState, useEffect, useRef, useMemo } from 'react';
import idleAnimationJsonUrl from '@assets/animations/idle/idle.json?url';
import runAnimationJsonUrl from '@assets/animations/run/run.json?url';
import jumpAnimationJsonUrl from '@assets/animations/jump/jump.json?url';
import idleTextureUrl from '@assets/animations/idle/texture.png';
import runTextureUrl from '@assets/animations/run/texture.png';
import jumpTextureUrl from '@assets/animations/jump/texture.png';
import winterBgImage from '@assets/winter-bg.jpg';

const SPRITE_SCALE = 0.3;
const SPRITE_SPEED = 4;
const JUMP_POWER = 20;
const GRAVITY = 0.8;
const GROUND_Y = 400;

export const GamePixi: FC = () => {
  useExtend({ Container, Graphics, Sprite, AnimatedSprite });

  const [idleTextures, setIdleTextures] = useState<Texture[] | null>(null);
  const [runTextures, setRunTextures] = useState<Texture[] | null>(null);
  const [jumpTextures, setJumpTextures] = useState<Texture[] | null>(null);
  const [backgroundTexture, setBackgroundTexture] = useState<Texture | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [spriteX, setSpriteX] = useState(200);
  const [spriteY, setSpriteY] = useState(GROUND_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });
  const spriteRef = useRef<AnimatedSpriteType | null>(null);
  const backgroundRef1 = useRef<SpriteType | null>(null);
  const backgroundRef2 = useRef<SpriteType | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const velocityYRef = useRef(0);
  const spriteYRef = useRef(GROUND_Y);
  const spriteXRef = useRef(200);
  const backgroundOffsetRef = useRef(0);

  // Обработка изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Обновление размеров фонов при изменении размера окна
  useEffect(() => {
    if (backgroundRef1.current) {
      backgroundRef1.current.width = windowSize.width;
      backgroundRef1.current.height = windowSize.height;
    }
    if (backgroundRef2.current) {
      backgroundRef2.current.width = windowSize.width;
      backgroundRef2.current.height = windowSize.height;
    }
  }, [windowSize]);

  // Загрузка фона
  useEffect(() => {
    const loadBackground = async () => {
      try {
        const texture = await Assets.load(winterBgImage);
        setBackgroundTexture(texture);
      } catch (error) {
        console.error('Failed to load background:', error);
      }
    };

    loadBackground();
  }, []);

  // Загрузка анимаций
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        // Загружаем idle анимацию
        // Загружаем JSON и текстуру отдельно
        const [idleJsonData, idleTexture] = await Promise.all([
          fetch(idleAnimationJsonUrl).then((res) => res.json()),
          Assets.load(idleTextureUrl),
        ]);
        // Исправляем путь к текстуре
        idleJsonData.meta.image = idleTextureUrl;
        // Создаем спрайт-лист вручную
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

  // Callback refs для сохранения ссылок на фоны
  const handleBackgroundRef1 = (sprite: SpriteType | null) => {
    backgroundRef1.current = sprite;
  };

  const handleBackgroundRef2 = (sprite: SpriteType | null) => {
    backgroundRef2.current = sprite;
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
      // Используем setTimeout для гарантии, что текстуры обновлены через пропсы
      const timeoutId = setTimeout(() => {
        if (spriteRef.current && currentTextures) {
          // Обновляем текстуры напрямую
          spriteRef.current.textures = currentTextures;
          spriteRef.current.loop = true;
          spriteRef.current.animationSpeed = 0.4;

          // Принудительно запускаем анимацию
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
  }, [spriteX]);

  // Физика и игровой цикл
  useEffect(() => {
    const updatePhysics = () => {
      // Применяем гравитацию
      velocityYRef.current += GRAVITY;

      // Обновляем позицию Y
      spriteYRef.current += velocityYRef.current;

      // Проверяем, достигли ли мы земли
      if (spriteYRef.current >= GROUND_Y) {
        spriteYRef.current = GROUND_Y;
        velocityYRef.current = 0;
        setIsJumping(false);
      }

      // Обновляем состояние
      setSpriteY(spriteYRef.current);
      setVelocityY(velocityYRef.current);

      const fixedPosition = windowSize.width * 0.4;
      let shouldMoveBackground = false;

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
          shouldMoveBackground = true;
        } else {
          if (typeof window !== 'undefined') {
            spriteXRef.current = Math.min(window.innerWidth, newX);
          } else {
            spriteXRef.current = newX;
          }
          setSpriteX(spriteXRef.current);
        }
      }

      // Двигаем фон если герой зафиксирован и движется вправо
      if (
        shouldMoveBackground ||
        (pressedKeysRef.current.has('ArrowRight') && spriteXRef.current >= fixedPosition)
      ) {
        backgroundOffsetRef.current -= SPRITE_SPEED * 0.5;
      }

      // Обновление позиций фонов для бесконечной сцены
      if (backgroundRef1.current && backgroundRef2.current) {
        const bgWidth = windowSize.width;
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

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [windowSize.width, spriteX]);

  // Обработка нажатий клавиш стрелок
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        // Прыжок только если персонаж на земле
        if (!isJumping && spriteYRef.current >= GROUND_Y - 1) {
          setIsJumping(true);
          velocityYRef.current = -JUMP_POWER;
          setVelocityY(-JUMP_POWER);
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
  }, [isJumping]);

  return (
    <div className={styles.gamePixi}>
      <Application
        backgroundColor={0x1099bb}
        resizeTo={typeof window !== 'undefined' ? window : undefined}
      >
        {backgroundTexture && (
          <>
            <pixiSprite
              ref={handleBackgroundRef1}
              texture={backgroundTexture}
              x={0}
              y={0}
              width={windowSize.width}
              height={windowSize.height}
              anchor={0}
            />
            <pixiSprite
              ref={handleBackgroundRef2}
              texture={backgroundTexture}
              x={windowSize.width}
              y={0}
              width={windowSize.width}
              height={windowSize.height}
              anchor={0}
            />
          </>
        )}
        {currentTextures && currentTextures.length > 0 && (
          <pixiAnimatedSprite
            ref={handleAnimatedSpriteRef}
            textures={currentTextures}
            loop={true}
            animationSpeed={0.4}
            anchor={0.5}
            x={spriteX}
            y={spriteY}
            scale={0.3}
          />
        )}
      </Application>
    </div>
  );
};
