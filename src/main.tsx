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
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
