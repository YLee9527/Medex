import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import Settings from './Settings';
import Update from './Update';
import '../index.css';

// 根据 URL 路径决定渲染哪个页面
const renderApp = () => {
  const pathname = window.location.pathname;

  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  if (pathname === '/pages/settings.html' || pathname.endsWith('settings.html')) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <Settings />
      </React.StrictMode>
    );
  } else if (pathname === '/pages/update.html' || pathname.endsWith('update.html')) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <Update />
      </React.StrictMode>
    );
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

renderApp();
