import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Remove loading screen quando a aplicação carrega
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.add('app-loaded');
  }, 500);
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);