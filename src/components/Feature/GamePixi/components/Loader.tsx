import type { FC } from 'react';
import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import christmasTreeAnimationData from '@assets/animations/christmas-tree.json';
import styles from './Loader.module.scss';

type LoaderProps = {
  isLoading: boolean;
};

export const Loader: FC<LoaderProps> = ({ isLoading }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isLoading) {
      // Используем requestAnimationFrame для асинхронного обновления состояния
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.loader} ${!isLoading ? styles.fadeOut : ''}`}>
      <div className={styles.animationContainer}>
        <Lottie animationData={christmasTreeAnimationData} loop={true} />
      </div>
    </div>
  );
};
