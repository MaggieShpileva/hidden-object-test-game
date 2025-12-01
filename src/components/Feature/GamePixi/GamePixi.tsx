import type { FC } from 'react';
import { Application, useExtend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';
import styles from './GamePixi.module.scss';
import { useState, useEffect, useRef } from 'react';
import { Background, Hero, Platforms, Loader } from './components';
import type { PlatformData } from './components/Platforms';
import { Modal, Button, Title, Typography } from '@components/UI';
import backgroundMusicUrl from '@assets/sounds/ikson-merry.mp3';

const SPRITE_SPEED = 4;

export const GamePixi: FC = () => {
  useExtend({ Container, Graphics, Sprite });

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const spriteXRef = useRef(200);
  const backgroundOffsetRef = useRef(0);
  const platformsRef = useRef<PlatformData[]>([]);

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

  const [count, setCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameKey, setGameKey] = useState(0); // Ключ для принудительного рестарта компонентов
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false); // Флаг для отслеживания запуска музыки
  const loadingTimeoutRef = useRef<number | null>(null);

  // Инициализация фоновой музыки
  useEffect(() => {
    backgroundMusicRef.current = new Audio(backgroundMusicUrl);
    backgroundMusicRef.current.volume = 0.3; // Устанавливаем громкость (0.0 - 1.0)
    backgroundMusicRef.current.loop = true; // Включаем зацикливание
    backgroundMusicRef.current.preload = 'auto';

    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      if (loadingTimeoutRef.current !== null) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Функция для запуска музыки при первом взаимодействии
  const startMusic = useRef(() => {
    if (!musicStartedRef.current && backgroundMusicRef.current) {
      musicStartedRef.current = true;
      backgroundMusicRef.current.play().catch((error) => {
        console.warn('Failed to play background music:', error);
        musicStartedRef.current = false; // Разрешаем повторную попытку
      });
    }
  });

  // Останавливаем музыку при game over, перезапускаем при рестарте
  useEffect(() => {
    if (backgroundMusicRef.current) {
      if (isGameOver) {
        backgroundMusicRef.current.pause();
      } else if (musicStartedRef.current) {
        // Перезапускаем музыку с начала при рестарте
        backgroundMusicRef.current.currentTime = 0;
        backgroundMusicRef.current.play().catch((error) => {
          console.warn('Failed to restart background music:', error);
        });
      }
    }
  }, [isGameOver]);

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const handleRestart = () => {
    // Сбрасываем все состояние игры
    setIsGameOver(false);
    setCount(0);
    pressedKeysRef.current.clear();
    spriteXRef.current = 200;
    backgroundOffsetRef.current = 0;
    platformsRef.current = [];
    setGameKey((prev) => prev + 1); // Изменяем ключ для принудительного рестарта компонентов
    // Музыка автоматически возобновится через useEffect при изменении isGameOver
  };

  // Запуск музыки при клике на экран (если еще не запущена)
  const handleClick = () => {
    startMusic.current();
  };

  return (
    <div className={styles.gamePixi} onClick={handleClick} onKeyDown={handleClick}>
      <Loader isLoading={isLoading} />
      <Application
        backgroundColor={0x1099bb}
        resizeTo={typeof window !== 'undefined' ? window : undefined}
      >
        <pixiContainer sortableChildren={true} key={gameKey}>
          <Background
            windowSize={windowSize}
            backgroundOffsetRef={backgroundOffsetRef}
            pressedKeysRef={pressedKeysRef}
            spriteXRef={spriteXRef}
            spriteSpeed={SPRITE_SPEED}
            fixedPosition={windowSize.width * 0.4}
          />
          <Platforms
            windowSize={windowSize}
            backgroundOffsetRef={backgroundOffsetRef}
            platformsRef={platformsRef}
          />
          <Hero
            key={gameKey}
            windowSize={windowSize}
            pressedKeysRef={pressedKeysRef}
            spriteXRef={spriteXRef}
            platformsRef={platformsRef}
            backgroundOffsetRef={backgroundOffsetRef}
            onMove={() => {
              setCount((prev) => prev + 1);
              // Запускаем музыку при первом движении
              startMusic.current();
            }}
            onGameOver={handleGameOver}
          />
        </pixiContainer>
      </Application>
      <div className={styles.count}>{Number(count).toLocaleString('ru-RU')}</div>
      <Modal isOpen={isGameOver} onClose={() => {}} className={styles.gameOverModal}>
        <div className={styles.gameOverModalContent}>
          <Title tag="h2" variant="medium">
            Игра закончена
          </Title>
          <Typography>Ваш результат: {Number(count).toLocaleString('ru-RU')}</Typography>
          <Typography className={styles.gameOverModalText}>
            Попробуйте снова и попытайтесь превзойти свой рекорд!
          </Typography>
          <Button
            variant="primary"
            size="large"
            onClick={handleRestart}
            className={styles.gameOverModalButton}
          >
            Попробовать снова
          </Button>
        </div>
      </Modal>
    </div>
  );
};
