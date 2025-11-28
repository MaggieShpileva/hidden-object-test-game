import type { FC } from 'react';
import { Application, useExtend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';
import styles from './GamePixi.module.scss';
import { useState, useEffect, useRef } from 'react';
import { Background, Hero, Platforms } from './components';
import type { PlatformData } from './components/Platforms';

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

  return (
    <div className={styles.gamePixi}>
      <Application
        backgroundColor={0x1099bb}
        resizeTo={typeof window !== 'undefined' ? window : undefined}
      >
        <pixiContainer sortableChildren={true}>
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
            windowSize={windowSize}
            pressedKeysRef={pressedKeysRef}
            spriteXRef={spriteXRef}
            platformsRef={platformsRef}
            backgroundOffsetRef={backgroundOffsetRef}
          />
        </pixiContainer>
      </Application>
    </div>
  );
};
