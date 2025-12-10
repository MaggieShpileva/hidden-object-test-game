import { useEffect, useState, useRef, useMemo, type FC } from 'react';
import styles from './Feed.module.scss';
import { Button } from '@/components/UI';
import clsx from 'clsx';

const VIDEO_URLS = [
  { id: 1, url: 'https://youtube.com/shorts/AG5b_t5QN3g?si=UQdJNe8nZtaV4uB0', time: '00:30' },
  { id: 2, url: 'https://www.youtube.com/shorts/XcOCV2gnePM?feature=share', time: '00:19' },
  { id: 3, url: 'https://www.youtube.com/shorts/wybtdQTZecc?feature=share', time: '00:20' },
];

/**
 * Конвертирует YouTube Shorts URL в embed URL
 * @param url - исходный URL видео
 * @param isMuted - нужно ли отключить звук (true = mute=1, false = mute=0)
 */
const convertToEmbedUrl = (url: string, isMuted: boolean = true): string => {
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    const videoId = shortsMatch[1];
    const muteParam = isMuted ? '1' : '0';
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muteParam}&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&enablejsapi=1`;
  }
  return url;
};

/**
 * Парсит время из формата "MM:SS" в секунды
 */
const parseTimeToSeconds = (time: string): number => {
  const [minutes, seconds] = time.split(':').map(Number);
  return minutes * 60 + seconds;
};

/**
 * Форматирует секунды в формат "MM:SS"
 */
const formatSecondsToTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

interface VideoItemProps {
  video: { id: number; url: string; time: string };
  isActive: boolean;
  currentTime: string;
  progress: number; // Прогресс от 0 до 100
  onVideoStarted?: () => void; // Callback когда видео начало воспроизводиться со звуком
}

const VideoItem: FC<VideoItemProps> = ({ video, isActive, progress, onVideoStarted }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef<boolean>(false);

  // Создаем URL один раз с mute=1 (звук выключен по умолчанию) и enablejsapi=1 для управления через API
  // Звук будет включаться только для активного видео через API
  const embedUrl = useMemo(() => convertToEmbedUrl(video.url, true), [video.url]);

  // Слушаем сообщения от YouTube iframe для определения готовности
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Проверяем, что сообщение от YouTube
      if (!event.origin.includes('youtube.com')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // Если iframe готов, помечаем его как готовый
        if (
          data &&
          (data.event === 'onReady' || data.info === 'onReady' || data.event === 'onStateChange')
        ) {
          isReadyRef.current = true;
        }
      } catch {
        // Игнорируем ошибки парсинга
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Управляем звуком через YouTube IFrame API без перезагрузки iframe
  useEffect(() => {
    if (!iframeRef.current) return;

    // Функция для безопасной отправки команды
    const sendCommand = (func: string) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      try {
        // Используем правильный origin для YouTube
        const targetOrigin = 'https://www.youtube.com';
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: func,
            args: '',
          }),
          targetOrigin
        );
      } catch {
        // Игнорируем ошибки тихо
      }
    };

    if (isActive) {
      // Для активного видео - задержка для гарантии загрузки API
      const timeoutId = setTimeout(() => {
        // Включаем звук для активного видео
        sendCommand('unMute');
        sendCommand('playVideo');

        // Уведомляем родительский компонент, что видео начало воспроизводиться со звуком
        if (onVideoStarted) {
          onVideoStarted();
        }
      }, 1500);

      return () => clearTimeout(timeoutId);
    } else {
      // Для неактивного видео - немедленное отключение звука без задержки
      sendCommand('mute');
      sendCommand('pauseVideo');
    }
  }, [isActive, onVideoStarted]);

  return (
    <div className={`${styles.modalVideoItem} ${isActive ? styles.videoActive : ''}`}>
      <div className={styles.progressIndicator}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>
      {embedUrl && (
        <iframe
          ref={iframeRef}
          className={styles.modalVideo}
          src={embedUrl}
          title={`Video ${video.id}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
};

export const Feed: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); // Флаг начала воспроизведения со звуком
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRemainingRef = useRef<number>(0);

  const handleOpenModal = () => {
    setCurrentVideoIndex(0);
    setIsModalOpen(true);
    setIsAnimating(true);
    setIsVideoPlaying(false); // Сбрасываем флаг воспроизведения
    // Инициализируем таймер для первого видео
    const initialTime = parseTimeToSeconds(VIDEO_URLS[0].time);
    setRemainingSeconds(initialTime);
  };

  const handleVideoStarted = () => {
    setIsVideoPlaying(true);
  };

  const handleNextVideo = () => {
    setIsTransitioning(true);
    setIsVideoPlaying(false); // Сбрасываем флаг при переключении
    setCurrentVideoIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= VIDEO_URLS.length) {
        return 0; // Зацикливаем на начало
      }
      return nextIndex;
    });
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrevVideo = () => {
    setIsTransitioning(true);
    setIsVideoPlaying(false); // Сбрасываем флаг при переключении
    setCurrentVideoIndex((prev) => {
      const prevIndex = prev - 1;
      return prevIndex < 0 ? VIDEO_URLS.length - 1 : prevIndex;
    });
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Универсальная функция для получения X координаты из события
  const getClientX = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ): number => {
    if ('touches' in e && e.touches.length > 0) {
      return e.touches[0].clientX;
    }
    if ('clientX' in e) {
      return e.clientX;
    }
    return 0;
  };

  const handleSwipeStart = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ) => {
    const clientX = getClientX(e);
    touchStartX.current = clientX;
    touchEndX.current = clientX;
  };

  const handleSwipeMove = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ) => {
    const clientX = getClientX(e);
    const deltaX = Math.abs(clientX - touchStartX.current);

    // Для touch событий проверяем вертикальное движение
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      const startY = touchStartX.current; // Сохраняем начальную Y координату
      const deltaY = Math.abs(touch.clientY - (startY || 0));

      // Если горизонтальное движение больше вертикального, предотвращаем дефолтное поведение
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }

    touchEndX.current = clientX;
  };

  const handleSwipeEnd = () => {
    if (!touchStartX.current || touchEndX.current === touchStartX.current) {
      touchStartX.current = 0;
      touchEndX.current = 0;
      return;
    }

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Минимальное расстояние для свайпа

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Свайп влево - следующее видео
        handleNextVideo();
      } else {
        // Свайп вправо - предыдущее видео
        handlePrevVideo();
      }
    }

    // Сбрасываем значения
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleCloseModal = () => {
    setIsAnimating(false);
    // Ждем завершения анимации перед полным скрытием
    setTimeout(() => {
      setIsModalOpen(false);
    }, 300); // Должно совпадать с длительностью transition
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  // Блокируем скролл body при открытой модалке
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Сбрасываем индикатор прогресса при переключении видео
  useEffect(() => {
    if (!isModalOpen) return;

    // Очищаем текущий таймер
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Сбрасываем прогресс на начальное значение нового видео
    const currentVideo = VIDEO_URLS[currentVideoIndex];
    const initialSeconds = parseTimeToSeconds(currentVideo.time);
    currentRemainingRef.current = initialSeconds;
    // Используем setTimeout для избежания предупреждения линтера о синхронном setState
    setTimeout(() => {
      setRemainingSeconds(initialSeconds);
      setIsVideoPlaying(false); // Сбрасываем флаг воспроизведения
    }, 0);
  }, [currentVideoIndex, isModalOpen]);

  // Таймер обратного отсчета - запускается только когда видео начало воспроизводиться со звуком
  useEffect(() => {
    if (!isModalOpen || !isAnimating || !isVideoPlaying) {
      // Очищаем таймер при закрытии модалки или когда видео не воспроизводится
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Сбрасываем предыдущий интервал
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Инициализируем таймер для текущего видео
    const currentVideo = VIDEO_URLS[currentVideoIndex];
    const initialSeconds = parseTimeToSeconds(currentVideo.time);
    currentRemainingRef.current = initialSeconds;
    // Используем setTimeout для избежания предупреждения линтера о синхронном setState
    setTimeout(() => {
      setRemainingSeconds(initialSeconds);
    }, 0);

    // Создаем интервал для обратного отсчета (обновляем каждые 100мс для плавности)
    const updateInterval = 100; // 100мс для плавного обновления

    timerIntervalRef.current = setInterval(() => {
      currentRemainingRef.current -= updateInterval / 1000; // Уменьшаем на 0.1 секунды

      if (currentRemainingRef.current <= 0) {
        // Таймер закончился, переключаем на следующее видео
        currentRemainingRef.current = 0;
        setRemainingSeconds(0);
        setIsTransitioning(true);
        setCurrentVideoIndex((currentIndex) => {
          const nextIndex = currentIndex + 1;
          return nextIndex >= VIDEO_URLS.length ? 0 : nextIndex;
        });
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      } else {
        setRemainingSeconds(Math.max(0, currentRemainingRef.current));
      }
    }, updateInterval);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isModalOpen, isAnimating, currentVideoIndex, isVideoPlaying]);

  return (
    <div className={styles.feed}>
      {isModalOpen && (
        <div
          className={`${styles.videoModal} ${isAnimating ? styles.modalOpen : styles.modalClose}`}
          onClick={handleBackdropClick}
        >
          <div className={clsx(styles.modalContent)}>
            <button className={styles.closeButton} onClick={handleCloseModal} aria-label="Close">
              ×
            </button>
            <div
              ref={modalBodyRef}
              className={`${styles.modalBody} ${isTransitioning ? styles.transitioning : ''}`}
              onTouchStart={handleSwipeStart}
              onTouchMove={handleSwipeMove}
              onTouchEnd={handleSwipeEnd}
              onMouseDown={handleSwipeStart}
              onMouseMove={handleSwipeMove}
              onMouseUp={handleSwipeEnd}
              onMouseLeave={handleSwipeEnd}
            >
              <div className={styles.videoContainer}>
                {VIDEO_URLS.map((video, index) => {
                  const isActive = index === currentVideoIndex;
                  const displayTime = isActive ? formatSecondsToTime(remainingSeconds) : video.time;

                  // Вычисляем прогресс для активного видео
                  let progress = 0;
                  if (isActive) {
                    const totalSeconds = parseTimeToSeconds(video.time);
                    const elapsed = totalSeconds - remainingSeconds;
                    progress = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;
                  } else {
                    // Для неактивных видео прогресс = 0 (серый)
                    progress = 0;
                  }

                  return (
                    <VideoItem
                      key={video.id}
                      video={video}
                      isActive={isActive}
                      currentTime={displayTime}
                      progress={progress}
                      onVideoStarted={isActive ? handleVideoStarted : undefined}
                    />
                  );
                })}
              </div>
              <div className={styles.videoIndicators}>
                {VIDEO_URLS.map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.indicator} ${index === currentVideoIndex ? styles.indicatorActive : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.buttonContainer}>
        <Button variant="primary" onClick={handleOpenModal} className={styles.videoModalButton}>
          Open
        </Button>
      </div>
    </div>
  );
};
