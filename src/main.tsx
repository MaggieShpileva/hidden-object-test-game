import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';

// Отключаем React DevTools в production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as Window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: any };
  try {
    // Удаляем DevTools hook
    if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      delete win.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    }
    // Создаем заглушку для предотвращения инициализации
    Object.defineProperty(win, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      get: () => undefined,
      set: () => {},
      configurable: true,
    });
  } catch {
    // Игнорируем ошибки
  }
}

// Обработка ошибок DevTools
if (typeof window !== 'undefined') {
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      typeof message === 'string' &&
      (message.includes('react_devtools') ||
        message.includes('Invalid argument not valid semver') ||
        message.includes('__REACT_DEVTOOLS'))
    ) {
      return true; // Подавляем ошибку
    }
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
