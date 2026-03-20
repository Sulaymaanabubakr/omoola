import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Outfit, sans-serif',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            style: { background: '#166534', color: '#fff' },
            iconTheme: { primary: '#4ade80', secondary: '#166534' },
          },
          error: {
            style: { background: '#dc2626', color: '#fff' },
            iconTheme: { primary: '#fca5a5', secondary: '#dc2626' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
