import { useState, useRef } from 'react';
import type { FC } from 'react';
import { gsap } from 'gsap';
import { Banner } from '@components/Feature';
import { Loader, type LoaderRefs } from '@/components/UI';

export const Home: FC = () => {
  const [shouldRenderLoader, setShouldRenderLoader] = useState(true);
  const loaderRef = useRef<LoaderRefs>({ container: null, animation: null });

  const handleSceneLoaded = () => {
    setTimeout(() => {
      // Функция для запуска анимации
      const startAnimation = () => {
        // Проверяем наличие refs
        if (!loaderRef.current) {
          setShouldRenderLoader(false);
          return;
        }

        const container = loaderRef.current.container;
        const animation = loaderRef.current.animation;

        if (!container || !animation) {
          setShouldRenderLoader(false);
          return;
        }

        // Отключаем взаимодействие во время анимации
        container.style.pointerEvents = 'none';

        // Создаем timeline для последовательной анимации
        const tl = gsap.timeline({
          onComplete: () => {
            setShouldRenderLoader(false);
          },
        });

        // Сначала скрываем анимацию (300мс)
        tl.to(animation, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        });

        // Затем скрываем фон через 200мс после начала (0.2 секунды от начала timeline)
        tl.to(
          container,
          {
            opacity: 0,
            duration: 0.4,
            delay: 0.2,
            ease: 'power2.out',
          },
          0.2 // Начинаем через 200мс после начала timeline
        );
      };

      // Используем requestAnimationFrame для гарантии, что элемент в DOM
      requestAnimationFrame(() => {
        requestAnimationFrame(startAnimation);
      });
    }, 1500);
  };

  return (
    <>
      {shouldRenderLoader && <Loader ref={loaderRef} />}
      <Banner onSceneLoaded={handleSceneLoaded} />
    </>
  );
};
