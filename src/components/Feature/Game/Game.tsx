import { Hero } from '@/components/UI/Hero';
import styles from './Game.module.scss';
import { Typography } from '@/components/UI';

export const Game = () => {
  return (
    <div className={styles.game}>
      <Hero />
      <Typography variant="regular" className={styles.description}>
        Перемещайте героя по экрану с помощью клавиш WASD
      </Typography>
    </div>
  );
};
