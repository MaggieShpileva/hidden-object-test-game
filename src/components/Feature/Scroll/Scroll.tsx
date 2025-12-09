import { useEffect, useState, type FC } from 'react';
import styles from './Scroll.module.scss';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Bird from '@assets/models/bird/Scene.jsx';
import { Title } from '@/components/UI';
import PNG_Map from '@assets/map.png';
import PNG_Bg from '@assets/bg.png';
import SVG_ScrollPageBanner from '@assets/scroll-page-banner.svg';
// Базовая ширина экрана для нормализации позиций (1920px - стандарт для десктопа)
const BASE_WIDTH = 1920;

/**
 * Нормализует значение позиции относительно ширины экрана
 * Это обеспечивает одинаковое визуальное расстояние на всех экранах
 */
const normalizePosition = (value: number): number => {
  const currentWidth = window.innerWidth;
  const ratio = currentWidth / BASE_WIDTH;
  return value * ratio;
};

// Константы для анимации при скролле (базовые значения для ширины 1920px)
const SCROLL_CONFIG = {
  firstRange: {
    maxScroll: 500,
    rotation: {
      y: { min: Math.PI / 2.5, max: -Math.PI / 3 },
      x: { min: Math.PI / 15, max: -Math.PI / 10 },
    },
    position: {
      x: { min: -5.5, max: 5 },
      y: { min: 1, max: -2 },
    },
    scale: { min: 1, max: 1.9 },
  },
  secondRange: {
    minScroll: 700,
    maxScroll: 1800,
    position: {
      x: { min: 5, max: -5 },
      y: { min: -2, max: -3 },
    },
    rotation: {
      y: { min: -Math.PI / 3, max: Math.PI / 2 },
    },
    scale: { min: 1.9, max: 1.2 },
  },
} as const;

// Начальные значения (будут нормализованы при инициализации)
const getInitialPosition = (): [number, number, number] => [normalizePosition(-2.5), 0, 0];
const INITIAL_ROTATION: [number, number, number] = [Math.PI / 15, Math.PI / 4, 0];
const INITIAL_SCALE = 1;

/**
 * Линейная интерполяция значения между min и max на основе прогресса (0-1)
 */
const lerp = (min: number, max: number, progress: number): number => {
  return min + (max - min) * progress;
};

export const Scroll: FC = () => {
  const [position, setPosition] = useState<[number, number, number]>(getInitialPosition());
  const [rotation, setRotation] = useState<[number, number, number]>(INITIAL_ROTATION);
  const [scale, setScale] = useState(INITIAL_SCALE);

  // Управление overflow: hidden только на странице с птицей
  useEffect(() => {
    // Добавляем класс для скрытия overflow
    document.body.classList.add('scroll-page-overflow-hidden');
    document.documentElement.classList.add('scroll-page-overflow-hidden');

    // Удаляем класс при размонтировании
    return () => {
      document.body.classList.remove('scroll-page-overflow-hidden');
      document.documentElement.classList.remove('scroll-page-overflow-hidden');
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const { firstRange, secondRange } = SCROLL_CONFIG;

      // Первый диапазон: 0-500
      if (scrollY <= firstRange.maxScroll) {
        const progress = scrollY / firstRange.maxScroll;

        // Вычисляем поворот
        const rotationY = lerp(firstRange.rotation.y.min, firstRange.rotation.y.max, progress);
        const rotationX = lerp(firstRange.rotation.x.min, firstRange.rotation.x.max, progress);
        setRotation([rotationX, rotationY, 0]);

        // Вычисляем позицию с нормализацией относительно ширины экрана
        const basePositionX = lerp(firstRange.position.x.min, firstRange.position.x.max, progress);
        const basePositionY = lerp(firstRange.position.y.min, firstRange.position.y.max, progress);
        setPosition([normalizePosition(basePositionX), basePositionY, 0]);

        // Вычисляем размер
        const currentScale = lerp(firstRange.scale.min, firstRange.scale.max, progress);
        setScale(currentScale);
      }
      // Второй диапазон: 700-1800
      else if (scrollY >= secondRange.minScroll && scrollY <= secondRange.maxScroll) {
        const rangeSize = secondRange.maxScroll - secondRange.minScroll;
        const scrollInRange = scrollY - secondRange.minScroll;
        const progress = scrollInRange / rangeSize;

        // Вычисляем поворот для второго диапазона
        const rotationY = lerp(secondRange.rotation.y.min, secondRange.rotation.y.max, progress);
        setRotation([0, rotationY, 0]);

        // Вычисляем позицию для второго диапазона с нормализацией
        const basePositionX = lerp(
          secondRange.position.x.min,
          secondRange.position.x.max,
          progress
        );
        const basePositionY = lerp(
          secondRange.position.y.min,
          secondRange.position.y.max,
          progress
        );
        setPosition([normalizePosition(basePositionX), basePositionY, 0]);

        // Вычисляем размер для второго диапазона
        const currentScale = lerp(secondRange.scale.min, secondRange.scale.max, progress);
        setScale(currentScale);
      }
    };

    // Обработчик изменения размера окна для пересчета позиций
    const handleResize = () => {
      // Пересчитываем текущую позицию при изменении размера окна
      handleScroll();
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Инициализация позиции при монтировании
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div className={styles.canvas}>
        <Canvas>
          <OrbitControls enableRotate={false} enableZoom={false} enablePan={false} />
          <directionalLight intensity={1} position={[0, 10, 10]} />
          <Bird scale={scale} position={position} rotation={rotation} />
        </Canvas>
      </div>
      <div className={styles.scrollBody}>
        <section className={styles.banner}>
          <img src={SVG_ScrollPageBanner} alt="Banner text" className={styles.bannerText} />
        </section>
        <section className={styles.map}>
          <Title tag="h2" className={styles.title}>
            Track friends around you and invite them to play together in the same world{' '}
          </Title>
          <img src={PNG_Map} alt="Map" />
        </section>
        <section className={styles.features}>
          <div className={styles.feature}>
            <Title tag="h2" className={styles.titleFeature}>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ad, asperiores tempore! A,
              fugit fuga, minima sapiente maxime inventore nostrum facere totam unde natus similique
              porro. Asperiores, quisquam dicta! Architecto, possimus.
            </Title>
            <img src={PNG_Bg} alt="Feature 1" />
          </div>
        </section>
      </div>
    </>
  );
};
