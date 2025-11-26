import { useRef, useState, useEffect } from 'react';
import type { FC } from 'react';
import { gsap } from 'gsap';
import styles from './Banner.module.scss';
import { OBJECTS } from '@/mock/objects';
import type { Object } from '@/mock/objects';
import { Modal } from '@/components/UI/Modal';
import JPG_Scene from '@assets/scene.jpg';
import { Cloud } from './components/Cloud';
import { useDragging } from './hooks/useDragging';
import { useImageLoader } from './hooks/useImageLoader';
import PNG_Star from '@assets/star.png';

const SCENE_WIDTH = 1000;
const SCENE_HEIGHT = 400;

interface BannerProps {
  onSceneLoaded?: () => void;
}

export const Banner: FC<BannerProps> = ({ onSceneLoaded }) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [selectedObject, setSelectedObject] = useState<Object | null>(null);
  const [visibleCloud, setVisibleCloud] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isOpenPrize, setIsOpenPrize] = useState(false);
  const [sceneOffsetX, setSceneOffsetX] = useState(0);
  const [clickedObjectsCount, setClickedObjectsCount] = useState(0);
  const clickedObjectsRef = useRef<Set<number>>(new Set());
  const pendingTargetObjectRef = useRef<Object | null>(null);
  const bonusRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const { isDragging, handleStart } = useDragging({
    bannerRef,
    sceneRef,
    onSceneOffsetChange: setSceneOffsetX,
    onDragStart: () => {
      setVisibleCloud(false);
    },
  });

  const handleObjectClick = (object: Object) => {
    if (isDragging) {
      return;
    }

    // Увеличиваем счетчик кликов, если объект еще не был кликнут
    if (!clickedObjectsRef.current.has(object.id)) {
      clickedObjectsRef.current.add(object.id);
      setClickedObjectsCount((prev) => prev + 1);
    }

    if (object.bonus) {
      // Если это целевой объект, сначала скрываем облако, затем открываем модалку
      setVisibleCloud(false);
      setSelectedObject(object);
      setIsOpenPrize(true);
      setTimeout(() => {
        setIsOpenModal(true);
      }, 600);
    } else {
      if (visibleCloud && selectedObject && !selectedObject.bonus) {
        setSelectedObject(object);
      } else {
        if (visibleCloud) {
          setVisibleCloud(false);
          setTimeout(() => {
            setSelectedObject(object);
            setVisibleCloud(true);
          }, 200);
        } else {
          setSelectedObject(object);
          setVisibleCloud(true);
        }
      }
    }
  };

  // Открываем модалку после скрытия облака
  useEffect(() => {
    if (!visibleCloud && pendingTargetObjectRef.current) {
      const targetObject = pendingTargetObjectRef.current;
      pendingTargetObjectRef.current = null;
      // Ждем завершения анимации скрытия (200ms) перед открытием модалки
      setTimeout(() => {
        setSelectedObject(targetObject);
        setIsOpenModal(true);
      }, 200);
    }
  }, [visibleCloud]);

  const handleCloseModal = () => {
    setIsOpenModal(false);
    setIsOpenPrize(false);
    setSelectedObject(null);
  };

  const handleBannerStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Не начинаем перетаскивание, если клик по изображению
    if ((e.target as HTMLElement).closest(`.${styles.image}`)) {
      return;
    }
    handleStart(e);
  };

  // Проверяем загрузку фонового изображения
  useImageLoader({
    imageSrc: JPG_Scene,
    onLoad: onSceneLoaded,
  });

  // Анимация появления и скрытия бонусного элемента
  useEffect(() => {
    OBJECTS.forEach((object) => {
      if (!object.bonus) return;

      const bonusElement = bonusRefs.current.get(object.id);
      if (!bonusElement) return;

      if (isOpenPrize && selectedObject?.id === object.id) {
        // Устанавливаем начальную позицию перед появлением
        gsap.set(bonusElement, {
          x: '-50%',
          y: '0%',
        });

        // Плавное появление
        gsap.fromTo(
          bonusElement,
          {
            opacity: 0,
            scale: 0,
            x: '50%',
            y: '-33%',
          },
          {
            opacity: 1,
            scale: 1,
            x: '50%',
            y: '-33%',
            duration: 0.3,
            ease: 'power2.out',
          }
        );
      } else {
        // Плавное скрытие
        gsap.to(bonusElement, {
          opacity: 0,
          scale: 0,
          x: '50%',
          y: '-33%',
          duration: 0.2,
          ease: 'power1.in',
        });
      }
    });
  }, [isOpenPrize, selectedObject]);

  return (
    <>
      <section
        ref={bannerRef}
        className={styles.banner}
        onMouseDown={handleBannerStart}
        onTouchStart={handleBannerStart}
      >
        <div ref={sceneRef} className={styles.scene}>
          {OBJECTS.map((object) => (
            <div
              key={object.id}
              className={styles.object}
              style={{
                left: `${(object.position.x / SCENE_WIDTH) * 100}%`,
                top: `${(object.position.y / SCENE_HEIGHT) * 100}%`,
                width: `${(object.size.width / SCENE_WIDTH) * 100}%`,
                height: `${(object.size.height / SCENE_HEIGHT) * 100}%`,
              }}
              onClick={() => handleObjectClick(object)}
            >
              <img src={object.image} alt={object.name} className={styles.image} />
              {object.bonus && (
                <div
                  ref={(el) => {
                    if (el) {
                      bonusRefs.current.set(object.id, el);
                    } else {
                      bonusRefs.current.delete(object.id);
                    }
                  }}
                  className={styles.bonus}
                  style={{
                    opacity: 0,
                    pointerEvents:
                      isOpenPrize && selectedObject?.id === object.id ? 'auto' : 'none',
                  }}
                >
                  <img src={PNG_Star} alt="star" className={styles.bonusImage} />
                  <img
                    src={object.bonus.imageUrl}
                    alt={object.bonus.name}
                    className={styles.prizeImage}
                  />
                </div>
              )}
            </div>
          ))}
          <div
            className={styles.additionalObject}
            style={{
              left: `${(190 / SCENE_WIDTH) * 100}%`,
              top: `${(0 / SCENE_HEIGHT) * 100}%`,
              width: `${(100 / SCENE_WIDTH) * 100}%`,
              height: `${(170 / SCENE_HEIGHT) * 100}%`,
            }}
            onClick={() => setVisibleCloud(true)}
          />
        </div>
      </section>
      <Modal isOpen={isOpenModal} onClose={handleCloseModal} bonus={selectedObject?.bonus} />
      <Cloud
        visible={visibleCloud}
        sceneOffsetX={sceneOffsetX}
        bannerRef={bannerRef}
        sceneRef={sceneRef}
        areaStyle={{
          left: 180,
          top: 20,
          width: 110,
          height: 170,
        }}
      />
      <div className={styles.count}>
        {clickedObjectsCount}/{OBJECTS.length}
      </div>
    </>
  );
};
