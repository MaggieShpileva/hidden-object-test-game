import { useEffect } from 'react';

interface UseImageLoaderProps {
  imageSrc: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const useImageLoader = ({ imageSrc, onLoad, onError }: UseImageLoaderProps) => {
  useEffect(() => {
    const checkImageLoaded = () => {
      const image = new Image();
      image.src = imageSrc;

      if (image.complete) {
        // Изображение уже загружено
        onLoad?.();
      } else {
        image.onload = () => {
          onLoad?.();
        };
        image.onerror = () => {
          onError?.();
          // Вызываем onLoad даже при ошибке, чтобы не блокировать загрузку
          onLoad?.();
        };
      }
    };

    // Проверяем загрузку сразу
    checkImageLoaded();
  }, [imageSrc, onLoad, onError]);
};
