import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled locally instead of loaded from Google Fonts
// (loading Google Fonts from Google's servers transmits visitors' IP addresses — a GDPR issue in the EU).
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';
import '@fontsource/cairo/900.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
// Maghribi-style display font for the home page titles.
import '@fontsource/ruwudu/700.css';
// Bold Kufic font for the intro title.
import '@fontsource/reem-kufi/arabic-700.css';
import App from './App.tsx';
import { initSettings } from './lib/settings';
import { reloadForUpdate } from './components/AppErrorBoundary';
import './index.css';
import './theme-dark.css';

initSettings();

// After an update the old code files are gone: a page that still runs the previous version
// reloads itself (once) instead of breaking when it opens a section for the first time.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadForUpdate();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
