import { useRef, useState } from 'react';
import type { FC } from 'react';
import styles from './Banner.module.scss';
import { OBJECTS } from '@/mock/objects';
import type { Object } from '@/mock/objects';
import { Modal } from '@/components/UI/Modal';

const SCENE_WIDTH = 1200;
const SCENE_HEIGHT = 540;

export const Banner: FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [selectedObject, setSelectedObject] = useState<Object | null>(null);

  const handleObjectClick = (object: Object) => {
    setSelectedObject(object);
  };

  const handleCloseModal = () => {
    setSelectedObject(null);
  };

  return (
    <>
      <section ref={bannerRef} className={styles.banner}>
        {OBJECTS.map((object) => (
          <img
            key={object.id}
            src={object.image}
            alt={object.name}
            className={styles.image}
            onClick={() => handleObjectClick(object)}
            style={{
              left: `${(object.position.x / SCENE_WIDTH) * 100}%`,
              top: `${(object.position.y / SCENE_HEIGHT) * 100}%`,
              width: `${(object.size.width / SCENE_WIDTH) * 100}%`,
              height: `${(object.size.height / SCENE_HEIGHT) * 100}%`,
            }}
          />
        ))}
      </section>
      <Modal isOpen={!!selectedObject} onClose={handleCloseModal} />
    </>
  );
};
