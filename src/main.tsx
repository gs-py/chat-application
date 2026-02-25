import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getFirebaseAnalytics } from '@/lib/firebase';
import './index.css';
import App from './App.tsx';

getFirebaseAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
