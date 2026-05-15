import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { QueryProvider } from './app/providers/QueryProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { I18nProvider } from './app/providers/I18nProvider';
import { api } from './shared/lib/api/axios';
import { setupInterceptors } from './shared/lib/api/interceptors';
import App from './app/App';
import './styles/globals.css';

setupInterceptors(api);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <I18nProvider>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>
);
