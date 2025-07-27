// src/index.js - Application Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Service Worker для PWA
import { registerSW } from './serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Регистрируем Service Worker для PWA функциональности
registerSW();

// Web Vitals для мониторинга производительности
import('./webVitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
});
