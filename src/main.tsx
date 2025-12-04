import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';

// Исправление для React DevTools и обработка ошибок в production
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Игнорируем ошибку React DevTools о версионировании
    if (typeof message === 'string' && message.includes('Invalid argument not valid semver')) {
      return true;
    }
    // Игнорируем ошибку Activity в production (связана с React DevTools)
    if (
      typeof message === 'string' &&
      (message.includes('Activity') || message.includes('Cannot set properties of undefined'))
    ) {
      console.warn('React DevTools related error ignored:', message);
      return true;
    }
    // Вызываем оригинальный обработчик для других ошибок
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };

  // Обработка необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      typeof event.reason === 'object' &&
      'message' in event.reason &&
      typeof event.reason.message === 'string' &&
      (event.reason.message.includes('Activity') ||
        event.reason.message.includes('Cannot set properties of undefined'))
    ) {
      console.warn('React DevTools related promise rejection ignored:', event.reason);
      event.preventDefault();
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
