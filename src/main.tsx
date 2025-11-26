import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';

// Исправление для React DevTools: перехватываем ошибку версионирования
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Игнорируем ошибку React DevTools о версионировании
    if (typeof message === 'string' && message.includes('Invalid argument not valid semver')) {
      return true; // Предотвращаем вывод ошибки в консоль
    }
    // Вызываем оригинальный обработчик для других ошибок
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
