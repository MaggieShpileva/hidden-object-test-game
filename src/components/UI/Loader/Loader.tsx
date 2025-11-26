import { useMemo, forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '@assets/animations/loader.json';
import styles from './Loader.module.scss';

export interface LoaderRefs {
  container: HTMLDivElement | null;
  animation: HTMLDivElement | null;
}

export const Loader = forwardRef<LoaderRefs>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<HTMLDivElement>(null);

  // Используем useImperativeHandle для правильной работы с ref
  useImperativeHandle(
    ref,
    () => ({
      container: containerRef.current,
      animation: animationRef.current,
    }),
    []
  );

  // Обновляем refs после монтирования
  useEffect(() => {
    if (ref && typeof ref === 'object' && 'current' in ref && ref.current) {
      ref.current.container = containerRef.current;
      ref.current.animation = animationRef.current;
    }
  }, [ref]);

  const defaultOptions = useMemo(
    () => ({
      loop: true,
      autoplay: true,
      animationData: loaderAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      },
    }),
    []
  );

  return (
    <div ref={containerRef} className={styles.loader}>
      <div ref={animationRef} className={styles.animationWrapper}>
        <Lottie
          animationData={defaultOptions.animationData}
          loop={defaultOptions.loop}
          autoplay={defaultOptions.autoplay}
          className={styles.animation}
        />
      </div>
    </div>
  );
});

Loader.displayName = 'Loader';
