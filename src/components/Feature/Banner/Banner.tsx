import { useEffect, useRef, useState, type FC } from 'react';
import { gsap } from 'gsap';
import styles from './Banner.module.scss';
import { OBJECTS, type Object, getRandomObject, getRandomObjectExcluding } from '@/mock/objects';
import { generateRandomPosition, type Position } from '@utils/positionUtils';
import { Modal } from '@components/UI';

export const Banner: FC = () => {
  const bannerRef = useRef<HTMLElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const initialTargetObject = getRandomObject();
  const targetObjectRef = useRef<Object>(initialTargetObject);
  const positionsUpdatedRef = useRef<number>(-1);
  const [targetObject, setTargetObject] = useState<Object>(initialTargetObject);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(true);
  const [isGameCompleteModalOpen, setIsGameCompleteModalOpen] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [usedObjectIds, setUsedObjectIds] = useState<number[]>([]);
  const [isFound, setIsFound] = useState(false);

  const handleImageClick = (index: number) => {
    const img = imageRefs.current[index];
    if (!img) return;

    const clickedObject = OBJECTS[index];
    const targetObject = targetObjectRef.current;

    if (clickedObject.id === targetObject.id) {
      setIsWinner(true);
      setIsFound(true);
      setUsedObjectIds((prev) => {
        if (!prev.includes(targetObject.id)) {
          return [...prev, targetObject.id];
        }
        return prev;
      });
      gsap.to(img, {
        scale: 2,
        duration: 2,
        ease: 'power2.out',
        onComplete: () => {
          setIsModalOpen(true);
        },
      });
    } else {
      if (isFound) return;
      setIsWinner(false);
      gsap.to(img, {
        scale: 0.9,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(img, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {},
          });
        },
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsFound(false);
    startNewGame();
  };

  const handleCloseGameCompleteModal = () => {
    setIsGameCompleteModalOpen(false);
    setIsFound(false);
    // Сбрасываем игру
    setUsedObjectIds([]);
    setGameKey(0);
    const newTarget = getRandomObject();
    targetObjectRef.current = newTarget;
    setTargetObject(newTarget);
    setIsStartModalOpen(true);
  };

  const handleCloseStartModal = () => {
    setIsStartModalOpen(false);
    setIsFound(false);
    // После закрытия стартовой модалки - показываем предметы
    setShowObjects(true);
  };

  const startNewGame = () => {
    // Проверяем, остались ли неиспользованные предметы
    const availableObject = getRandomObjectExcluding(usedObjectIds);

    if (!availableObject) {
      // Все предметы найдены - показываем модалку завершения
      setIsGameCompleteModalOpen(true);
      return;
    }

    // Анимируем скрытие предметов
    imageRefs.current.forEach((img) => {
      if (img) {
        gsap.to(img, {
          opacity: 0,
          scale: 0,
          duration: 0.3,
          ease: 'power2.in',
        });
      }
    });

    setTimeout(() => {
      setShowObjects(false);

      targetObjectRef.current = availableObject;
      setTargetObject(availableObject);

      setGameKey((prev) => prev + 1);

      setIsStartModalOpen(true);
    }, 300);
  };

  useEffect(() => {
    if (!showObjects) {
      imageRefs.current.forEach((img) => {
        if (img) {
          gsap.set(img, { opacity: 0, scale: 0 });
        }
      });
      return;
    }

    const banner = bannerRef.current;
    if (!banner) return;

    // Предотвращаем двойной рендер для одного и того же gameKey
    if (positionsUpdatedRef.current === gameKey) {
      return;
    }
    positionsUpdatedRef.current = gameKey;

    let isUpdating = false;

    const updatePositions = () => {
      if (isUpdating) return;
      isUpdating = true;

      const containerWidth = banner.offsetWidth;
      const containerHeight = banner.offsetHeight;

      if (containerWidth === 0 || containerHeight === 0) {
        isUpdating = false;
        return;
      }

      const viewportWidth = window.innerWidth;
      const existingPositions: Position[] = [];

      imageRefs.current.forEach((img, index) => {
        if (!img) return;

        const object: Object | undefined = OBJECTS[index];
        if (!object) return;

        // Конвертируем dvw в пиксели: 1dvw = viewportWidth / 100
        const elementWidth = (object.width * viewportWidth) / 100;
        const elementHeight = elementWidth; // Сохраняем aspect-ratio 1:1

        const position = generateRandomPosition(
          containerWidth,
          containerHeight,
          elementWidth,
          elementHeight,
          existingPositions,
          object.half
        );

        if (position) {
          existingPositions.push(position);

          gsap.set(img, {
            x: position.x,
            y: position.y,
            width: elementWidth,
            height: elementHeight,
            opacity: 0,
            scale: 0,
          });

          gsap.to(img, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            delay: index * 0.1,
            ease: 'back.out(1.7)',
            onComplete: () => {
              if (index === imageRefs.current.length - 1) {
                isUpdating = false;
              }
            },
          });
        }
      });
    };

    const timeoutId = setTimeout(updatePositions, 100);

    const resizeObserver = new ResizeObserver(() => {
      if (showObjects && !isUpdating) {
        updatePositions();
      }
    });

    resizeObserver.observe(banner);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      isUpdating = false;
    };
  }, [showObjects, gameKey]);

  return (
    <>
      <section ref={bannerRef} className={styles.banner}>
        {OBJECTS.map((object, index) => {
          return (
            <img
              key={object.id}
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              src={object.image}
              alt={object.name}
              className={styles.image}
              onClick={() => handleImageClick(index)}
              style={{
                pointerEvents: isFound ? 'none' : 'auto',
                cursor: isFound ? 'default' : 'pointer',
              }}
            />
          );
        })}
      </section>
      <Modal
        isOpen={isStartModalOpen}
        onClose={handleCloseStartModal}
        targetObjectName={targetObject.name}
      />
      <Modal
        isOpen={isModalOpen}
        isWinner={isWinner}
        onClose={handleCloseModal}
        targetObjectName={targetObject.name}
      />
      <Modal
        isOpen={isGameCompleteModalOpen}
        onClose={handleCloseGameCompleteModal}
        isGameComplete={true}
      />
    </>
  );
};
