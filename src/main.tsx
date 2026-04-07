import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Settings from './pages/Settings';
import Update from './pages/Update';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import './index.css';

// 根据 URL 路径决定渲染哪个页面
const renderApp = () => {
  const pathname = window.location.pathname;
  const rootElement = document.getElementById('root');
  
  if (!rootElement) return;

  if (pathname.includes('settings.html')) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <I18nProvider>
          <ThemeProvider>
            <Settings />
          </ThemeProvider>
        </I18nProvider>
      </React.StrictMode>
    );
  } else if (pathname.includes('update.html')) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <I18nProvider>
          <ThemeProvider>
            <Update />
          </ThemeProvider>
        </I18nProvider>
      </React.StrictMode>
    );
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <I18nProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </I18nProvider>
      </React.StrictMode>
    );
  }
};

renderApp();
