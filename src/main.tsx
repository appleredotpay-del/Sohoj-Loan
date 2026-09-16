import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept relative fetch calls inside Capacitor to point to the live hosted API
const isCapacitor = 
  typeof window !== 'undefined' && 
  (!!(window as any).Capacitor ||
   window.location.origin.startsWith('capacitor://') || 
   (window.location.origin.startsWith('http://localhost') && !window.location.origin.includes(':3000')) ||
   (window.location.origin.startsWith('https://localhost') && !window.location.origin.includes(':3000')));

// Global fetch interceptor to inject API base URL (Capacitor) and session tokens
try {
  const originalFetch = window.fetch.bind(window);
  const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let targetInput = input;
    const sessionToken = localStorage.getItem('nano_session_token');

    if (isCapacitor && typeof input === 'string' && input.startsWith('/api/')) {
      const savedUrl = localStorage.getItem('custom_api_url');
      const API_BASE_URL = savedUrl ? savedUrl.trim() : 'https://nano-finance-5bml.onrender.com';
      targetInput = `${API_BASE_URL}${input}`;
    }

    if (sessionToken && typeof input === 'string' && input.includes('/api/')) {
      const modifiedInit: RequestInit = { ...(init || {}) };
      const headers = new Headers(modifiedInit.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
      }
      if (!headers.has('x-session-token')) {
        headers.set('x-session-token', sessionToken);
      }
      modifiedInit.headers = headers;
      return originalFetch(targetInput, modifiedInit);
    }

    return originalFetch(targetInput, init);
  };

  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true
  });
} catch (err) {
  console.warn('Unable to override window.fetch:', err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
