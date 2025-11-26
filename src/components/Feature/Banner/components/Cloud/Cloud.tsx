import { useRef, useEffect } from 'react';
import type { FC, RefObject } from 'react';
import { gsap } from 'gsap';
import PNG_Cloud from '@assets/cloud.png';
import styles from './Cloud.module.scss';

const SCENE_WIDTH = 1000;
const SCENE_HEIGHT = 400;

interface CloudProps {
  visible: boolean;
  sceneOffsetX: number;
  bannerRef: RefObject<HTMLDivElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
  areaStyle: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export const Cloud: FC<CloudProps> = ({
  visible,
  sceneOffsetX,
  bannerRef,
  sceneRef,
  areaStyle,
}) => {
  const cloudRef = useRef<HTMLDivElement>(null);

  // Вычисляем позицию облака справа от области
  const getCloudPosition = () => {
    if (!bannerRef.current || !sceneRef.current) {
      return { left: 0, top: 0 };
    }

    const sceneWidth = sceneRef.current.offsetWidth;
    const bannerWidth = bannerRef.current.offsetWidth;

    // Позиция области на экране с учетом смещения сцены
    const areaScreenX = (areaStyle.left / SCENE_WIDTH) * sceneWidth + sceneOffsetX;
    const areaWidth = (areaStyle.width / SCENE_WIDTH) * sceneWidth;

    // Позиция облака справа от области
    const cloudLeft = ((areaScreenX + areaWidth) / bannerWidth) * 100;
    const cloudTop = (areaStyle.top / SCENE_HEIGHT) * 100;

    return { left: cloudLeft, top: cloudTop };
  };

  // Анимация появления и скрытия облака
  useEffect(() => {
    if (!cloudRef.current) return;

    if (visible && bannerRef.current && sceneRef.current) {
      // Устанавливаем правильную позицию перед появлением
      const position = getCloudPosition();
      gsap.set(cloudRef.current, {
        left: `${position.left}%`,
        top: `${position.top}%`,
      });

      // Плавное появление
      gsap.fromTo(
        cloudRef.current,
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        }
      );
    } else {
      // Плавное скрытие
      gsap.to(cloudRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        ease: 'power1.in',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, bannerRef, sceneRef, areaStyle, sceneOffsetX]);

  // Анимация перемещения облака при смещении сцены
  useEffect(() => {
    if (!cloudRef.current || !bannerRef.current || !sceneRef.current) return;
    if (!visible) return; // Не обновляем позицию, если облако скрыто

    const position = getCloudPosition();

    // Плавно перемещаем облако на новую позицию
    gsap.to(cloudRef.current, {
      left: `${position.left}%`,
      top: `${position.top}%`,
      duration: 0.3,
      ease: 'power2.out',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneOffsetX, visible, bannerRef, sceneRef, areaStyle]);

  return (
    <div
      ref={cloudRef}
      className={styles.cloud}
      style={{
        opacity: 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <img src={PNG_Cloud} alt="Cloud" />
    </div>
  );
};
