import { useEffect, useRef, type FC } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import clsx from 'clsx';
import styles from './Modal.module.scss';
import { Button } from '../Button';
import { Typography } from '../Typography';
import { Title } from '../Title';

type ModalProps = {
  isOpen: boolean;
  isWinner?: boolean;
  onClose: () => void;
  children?: ReactNode;
  targetObjectName?: string;
  isGameComplete?: boolean;
};

export const Modal: FC<ModalProps> = ({
  isOpen,
  isWinner,
  onClose,
  children,
  targetObjectName,
  isGameComplete,
}) => {
  const isStartModal = targetObjectName !== undefined && isWinner === undefined && !isGameComplete;
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
        className={clsx(styles.content, {
          [styles.winner]: isWinner === true,
          [styles.loser]: isWinner === false,
          [styles.start]: isStartModal,
          [styles.gameComplete]: isGameComplete,
        })}
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <Title tag="h2" variant="medium" className={styles.title}>
            {isGameComplete
              ? '🏆 Поздравляем!'
              : isStartModal
                ? '🔍 Найдите предмет'
                : isWinner
                  ? '🎉 Поздравляем!'
                  : '😔 Попробуйте еще раз'}
          </Title>
        </div>
        <div className={styles.body}>
          <Typography className={styles.message}>
            {isGameComplete
              ? 'Вы прошли игру! Все предметы найдены! Отличная работа!'
              : isStartModal
                ? `Найдите предмет: "${targetObjectName}"`
                : isWinner
                  ? 'Вы нашли правильный предмет! Отличная работа!'
                  : 'К сожалению, это не тот предмет. Попробуйте найти правильный!'}
          </Typography>
          {children}
        </div>
        <div className={styles.footer}>
          <Button variant="primary" onClick={handleClose} fullWidth>
            {isGameComplete ? 'Начать заново' : isStartModal ? 'Начать игру' : 'Закрыть'}
          </Button>
        </div>
      </div>
    </div>
  );
};
