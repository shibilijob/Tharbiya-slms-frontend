import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.info('PWA Service Worker registration:', err);
    });
  });
} else if ('serviceWorker' in navigator) {
  // In development, also register so beforeinstallprompt works on localhost
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
