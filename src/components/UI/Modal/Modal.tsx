import { useEffect, useRef, type FC } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import clsx from 'clsx';
import styles from './Modal.module.scss';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  bonus?: { name: string; imageUrl: string; link: string } | null;
  className?: string;
};

export const Modal: FC<ModalProps> = ({ isOpen, onClose, bonus, children, className }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;

    gsap.set(overlay, { opacity: 0 });
    gsap.set(content, { scale: 0.8, opacity: 0, y: 50 });

    const timeline = gsap.timeline();

    timeline.to(overlay, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });

    timeline.to(
      content,
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'back.out(1.7)',
      },
      '-=0.2'
    );

    return () => {
      timeline.kill();
    };
  }, [isOpen]);

  const handleClose = () => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;

    const timeline = gsap.timeline({
      onComplete: () => {
        onClose();
      },
    });

    timeline.to(content, {
      scale: 0.8,
      opacity: 0,
      y: 50,
      duration: 0.2,
      ease: 'power2.in',
    });

    timeline.to(
      overlay,
      {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      },
      '-=0.2'
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleClose}>
      <div
        className={clsx(styles.content, className)}
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {children ? (
          children
        ) : (
          <>
            <img src={bonus?.imageUrl} alt={bonus?.name} className={styles.image} />
            <p className={styles.name}>{bonus?.name}</p>
            <button className={styles.button} onClick={handleClose}>
              купить
            </button>
          </>
        )}
      </div>
    </div>
  );
};
