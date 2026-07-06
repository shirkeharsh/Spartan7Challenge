import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as serviceWorker from './registerServiceWorker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

serviceWorker.register();

// Prevent multi-touch pinch zoom gestures on iOS Safari
if (typeof document !== 'undefined') {
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });
}
