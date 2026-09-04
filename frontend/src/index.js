import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA support (Add to Home Screen, offline shell caching)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('CogniVeil PWA Service Worker registered with scope: ', registration.scope);
      })
      .catch((error) => {
        console.log('CogniVeil PWA Service Worker registration failed: ', error);
      });
  });
}

reportWebVitals();

