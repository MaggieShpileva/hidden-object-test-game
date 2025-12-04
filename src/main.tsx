import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';

// Отключаем React DevTools в production для предотвращения ошибок
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // Отключаем React DevTools
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as Window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: any };
  if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      win.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers?.clear();
      win.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
      delete win.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    } catch {
      // Игнорируем ошибки удаления
    }
  }
}

// Обработка ошибок в production
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Игнорируем ошибки, связанные с React DevTools
    if (
      typeof message === 'string' &&
      (message.includes('Activity') ||
        message.includes('Cannot set properties of undefined') ||
        message.includes('Invalid argument not valid semver') ||
        message.includes('__REACT_DEVTOOLS'))
    ) {
      return true; // Подавляем ошибку
    }
    // Вызываем оригинальный обработчик для других ошибок
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };

  // Обработка необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason &&
      typeof reason === 'object' &&
      'message' in reason &&
      typeof reason.message === 'string' &&
      (reason.message.includes('Activity') ||
        reason.message.includes('Cannot set properties of undefined') ||
        reason.message.includes('__REACT_DEVTOOLS'))
    ) {
      event.preventDefault();
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Безопасная инициализация React с обработкой ошибок
try {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  // Если произошла ошибка при инициализации, пробуем без StrictMode
  console.warn('Error during React initialization, retrying without StrictMode:', error);
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (retryError) {
    console.error('Failed to initialize React:', retryError);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Application Error</h1>
        <p>Failed to initialize the application. Please refresh the page.</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}
