import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  console.error('Insight Rides could not mount because #root is missing.');
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
