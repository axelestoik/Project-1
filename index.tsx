
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';
import { AuthProvider } from '@/core/auth/AuthContext';
import { I18nProvider } from '@/core/i18n/I18nContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
