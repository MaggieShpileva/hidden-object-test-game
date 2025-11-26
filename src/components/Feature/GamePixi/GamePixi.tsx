import type { FC } from 'react';
import { Application, useApplication, useExtend, useTick, type ApplicationRef } from '@pixi/react';
import { Container, Graphics, Sprite, Assets, Rectangle } from 'pixi.js';
import type { Texture } from 'pixi.js';
import styles from './GamePixi.module.scss';
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';

type SpriteRef = {
  getPosition: () => { x: number; y: number };
  getSize: () => { width: number; height: number };
};

const RotatingSprite = forwardRef<
  SpriteRef,
  {
    texture: Texture;
    width: number;
    height: number;
    initialX: number;
    initialY: number;
    speed: number;
  }
>(({ texture, width, height, initialX, initialY, speed }, ref) => {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const containerRef = useRef<Container | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const { app } = useApplication();
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const positionRef = useRef({ x: initialX, y: initialY });

  // Физика прыжка
  const velocityYRef = useRef(0); // Вертикальная скорость
  const isGroundedRef = useRef(true); // На земле ли спрайт
  const hasJumpedRef = useRef(false); // Флаг для отслеживания, был ли выполнен прыжок для текущего нажатия
  const jumpPower = 15; // Сила прыжка
  const gravity = 0.8; // Гравитация
  const groundLevel = initialY; // Уровень земли

  // Фиксируем размеры через ref, чтобы они не изменялись
  const fixedSizeRef = useRef({ width, height });

  // Обновляем размеры только при изменении пропсов
  useEffect(() => {
    fixedSizeRef.current = { width, height };
  }, [width, height]);

  // Синхронизируем ref с состоянием
  useEffect(() => {
    positionRef.current = { x, y };
  }, [x, y]);

  useImperativeHandle(ref, () => ({
    getPosition: () => positionRef.current,
    getSize: () => ({ width, height }),
  }));

  // Обработка нажатий клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Предотвращаем стандартное поведение для пробела (прокрутка страницы)
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();
      pressedKeysRef.current.add(key);
      pressedKeysRef.current.add(code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();
      pressedKeysRef.current.delete(key);
      pressedKeysRef.current.delete(code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Обновление позиции в useTick
  useTick(() => {
    if (!app) return;

    const pressedKeys = pressedKeysRef.current;
    const currentPos = positionRef.current;
    let newX = currentPos.x;
    let newY = currentPos.y;
    let newDirection = direction;

    // Горизонтальное движение (A/D или стрелки влево/вправо)
    if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) {
      newX -= speed;
      newDirection = 'left';
    }

    if (pressedKeys.has('d') || pressedKeys.has('arrowright')) {
      newX += speed;
      newDirection = 'right';
    }

    // Прыжок (пробел) - проверяем ПЕРЕД применением физики
    const isSpacePressed = pressedKeys.has(' ') || pressedKeys.has('space');

    // Проверяем, на земле ли спрайт (на основе текущей позиции и скорости)
    const isOnGround = currentPos.y >= groundLevel - 1 && velocityYRef.current === 0;

    // Прыжок происходит только один раз при нажатии пробела, когда на земле
    if (isSpacePressed && isOnGround && !hasJumpedRef.current) {
      velocityYRef.current = -jumpPower;
      isGroundedRef.current = false;
      hasJumpedRef.current = true;
    }

    // Физика прыжка и гравитация
    // Применяем гравитацию всегда, если скорость не нулевая или не на земле
    if (velocityYRef.current !== 0 || !isGroundedRef.current) {
      velocityYRef.current += gravity;
      newY += velocityYRef.current;

      // Проверяем, приземлился ли спрайт
      if (newY >= groundLevel) {
        newY = groundLevel;
        velocityYRef.current = 0;
        isGroundedRef.current = true;
        hasJumpedRef.current = false; // Сбрасываем флаг прыжка при приземлении
      } else {
        isGroundedRef.current = false;
      }
    } else {
      // Если на земле и скорость нулевая, фиксируем позицию
      newY = groundLevel;
      isGroundedRef.current = true;
    }

    // Ограничение движения границами экрана
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    newX = Math.max(halfWidth, Math.min(screenWidth - halfWidth, newX));
    // Ограничиваем вертикальное движение: снизу - земля (только если не в воздухе), сверху - верх экрана
    // Если спрайт в воздухе (newY < groundLevel), не ограничиваем снизу
    if (newY >= groundLevel) {
      // На земле или ниже - ограничиваем снизу до уровня земли
      newY = Math.max(groundLevel, newY);
    }
    // Всегда ограничиваем сверху
    newY = Math.min(screenHeight - halfHeight, newY);

    // Обновляем positionRef синхронно для следующего тика
    positionRef.current = { x: newX, y: newY };

    // Обновляем состояние только если позиция изменилась
    if (newX !== currentPos.x) {
      setX(newX);
    }
    if (newY !== currentPos.y) {
      setY(newY);
    }
    if (newDirection !== direction) {
      setDirection(newDirection);
    }
  });

  // useTick(() => {
  //   setX((currentX) => {
  //     // Учитываем anchor={0.5}, поэтому проверяем края с учетом половины ширины
  //     const halfWidth = width / 2;
  //     const screenWidth = app.screen.width;

  //     // Проверяем правый край
  //     if (direction === 'right' && currentX + halfWidth >= screenWidth) {
  //       setDirection('left');
  //       return screenWidth - halfWidth; // Останавливаемся у правого края
  //     }

  //     // Проверяем левый край
  //     if (direction === 'left' && currentX - halfWidth <= 0) {
  //       setDirection('right');
  //       return halfWidth; // Останавливаемся у левого края
  //     }

  //     // Двигаемся в текущем направлении
  //     return direction === 'right' ? currentX + speed : currentX - speed;
  //   });
  // });

  const handleClick = () => {
    console.log('Sprite clicked!', { x, y: initialY, width, height });
  };

  // Функция для отрисовки hitArea с useCallback
  const drawHitArea = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      // Рисуем контур hitArea
      // Используем реальные размеры width и height (без учета scale спрайта)
      // так как hitArea задается в локальных координатах спрайта

      // Рисуем полупрозрачную красную заливку для видимости
      graphics
        .rect(-width / 2, -height / 2, width, height)
        .fill({ color: 0xff0000, alpha: 0.3 })
        .stroke({ width: 2, color: 0xff0000, alpha: 1 });
    },
    [width, height]
  );

  // hitArea для спрайта (относительно центра из-за anchor={0.5})
  // Используем useMemo, чтобы не создавать новый объект при каждом рендере
  const hitArea = useMemo(
    () => new Rectangle(-width / 2, -height / 2, width, height),
    [width, height]
  );

  // Вычисляем scale на основе размера текстуры и желаемого размера
  const spriteScale = useMemo(() => {
    if (!texture) return { x: direction === 'left' ? -1 : 1, y: 1 };

    const textureWidth = texture.width || texture.source?.width || width;
    const textureHeight = texture.height || texture.source?.height || height;

    // Вычисляем масштаб для достижения желаемого размера
    const scaleX = (width / textureWidth) * (direction === 'left' ? -1 : 1);
    const scaleY = height / textureHeight;

    return { x: scaleX, y: scaleY };
  }, [texture, width, height, direction]);

  return (
    <pixiContainer ref={containerRef} x={x} y={y}>
      {/* Спрайт */}
      <pixiSprite
        ref={spriteRef}
        texture={texture}
        anchor={0.5}
        scale={spriteScale}
        eventMode="static"
        cursor="pointer"
        onClick={handleClick}
        hitArea={hitArea}
      />
      {/* Визуализация hitArea - рисуем ПОСЛЕ спрайта, чтобы было видно */}
      <pixiGraphics draw={drawHitArea} />
    </pixiContainer>
  );
});

RotatingSprite.displayName = 'RotatingSprite';

// Функция проверки коллизии между двумя прямоугольниками
const checkCollision = (
  pos1: { x: number; y: number },
  size1: { width: number; height: number },
  pos2: { x: number; y: number },
  size2: { width: number; height: number }
): boolean => {
  // Учитываем anchor={0.5}, поэтому центр спрайта находится в позиции (x, y)
  const left1 = pos1.x - size1.width / 2;
  const right1 = pos1.x + size1.width / 2;
  const top1 = pos1.y - size1.height / 2;
  const bottom1 = pos1.y + size1.height / 2;

  const left2 = pos2.x - size2.width / 2;
  const right2 = pos2.x + size2.width / 2;
  const top2 = pos2.y - size2.height / 2;
  const bottom2 = pos2.y + size2.height / 2;

  // Проверяем пересечение прямоугольников
  return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
};

// Компонент для проверки коллизий внутри Application
const CollisionChecker: FC<{
  sprite1Ref: React.RefObject<SpriteRef | null>;
  sprite2Ref: React.RefObject<SpriteRef | null>;
  onCollisionChange: (isColliding: boolean) => void;
}> = ({ sprite1Ref, sprite2Ref, onCollisionChange }) => {
  useTick(() => {
    if (sprite1Ref.current && sprite2Ref.current) {
      const pos1 = sprite1Ref.current.getPosition();
      const size1 = sprite1Ref.current.getSize();
      const pos2 = sprite2Ref.current.getPosition();
      const size2 = sprite2Ref.current.getSize();

      const colliding = checkCollision(pos1, size1, pos2, size2);
      onCollisionChange(colliding);

      if (colliding) {
        console.log('Спрайты касаются друг друга!', { pos1, pos2 });
      }
    }
  });

  return null;
};

export const GamePixi: FC = () => {
  useExtend({ Container, Graphics, Sprite });

  // const [texture, setTexture] = useState<Texture | null>(null);
  const [texture2, setTexture2] = useState<Texture | null>(null);
  const [isColliding, setIsColliding] = useState(false);

  const sprite1Ref = useRef<SpriteRef>(null);
  const sprite2Ref = useRef<SpriteRef>(null);

  useEffect(() => {
    // Assets.load('/src/assets/hero/idle/Idle-1.png').then((loadedTexture: Texture) => {
    // setTexture(loadedTexture);
    // });
    Assets.load('/src/assets/hero/run/run-1.png').then((loadedTexture: Texture) => {
      setTexture2(loadedTexture);
    });
  }, []);

  const appRef = useRef<ApplicationRef | null>(null);

  const resizeApp = useCallback(() => {
    if (appRef.current) {
      const app = appRef.current.getApplication();
      if (app) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        app.renderer.resize(width, height);
        app.screen.width = width;
        app.screen.height = height;
      }
    }
  }, []);

  useEffect(() => {
    // Добавляем небольшую задержку для того, чтобы Application успел смонтироваться
    const timeoutId = setTimeout(() => {
      resizeApp();
    }, 0);

    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', resizeApp);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', resizeApp);
    };
  }, [resizeApp]);

  // Инициализируем с правильными размерами сразу
  const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

  return (
    <div className={styles.gamePixi}>
      <Application
        ref={appRef}
        width={initialWidth}
        height={initialHeight}
        backgroundColor={0x1099bb}
        resizeTo={typeof window !== 'undefined' ? window : undefined}
      >
        <CollisionChecker
          sprite1Ref={sprite1Ref}
          sprite2Ref={sprite2Ref}
          onCollisionChange={setIsColliding}
        />
        {texture2 && (
          <RotatingSprite
            ref={sprite1Ref}
            texture={texture2}
            width={150}
            height={150}
            initialX={150}
            initialY={300}
            speed={1}
          />
        )}
        {/* {texture && (
          <RotatingSprite
            ref={sprite2Ref}
            texture={texture}
            width={200}
            height={200}
            initialX={400}
            initialY={300}
            speed={10}
          />
        )} */}
        {/* Индикатор коллизии */}
        {isColliding && (
          <pixiGraphics
            draw={(graphics) => {
              graphics.clear();
              graphics
                .rect(10, 10, 200, 50)
                .fill({ color: 0xff0000, alpha: 0.8 })
                .stroke({ width: 2, color: 0xffffff });
            }}
          />
        )}
      </Application>
      {/* Визуальный индикатор коллизии в UI */}
      {isColliding && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'red',
            color: 'white',
            padding: '10px',
          }}
        >
          КОЛЛИЗИЯ!
        </div>
      )}
    </div>
  );
};
