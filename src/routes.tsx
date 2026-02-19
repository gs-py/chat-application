import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Chat } from '@/pages/Chat';
import { NotFound } from '@/pages/NotFound';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/chat" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/chat', element: <Chat /> },
  { path: '*', element: <NotFound /> },
]);
