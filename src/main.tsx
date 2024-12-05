// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './lib/router';
import { AuthProvider } from './contexts/AuthContext';
import emailjs from '@emailjs/browser';
import './index.css';
import './styles/custom-components.css';

// Initialize EmailJS
if (!import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
  console.error('EmailJS public key is missing from environment variables');
} else {
  emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);