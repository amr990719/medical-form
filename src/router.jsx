import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import FormPage from './pages/FormPage';
import ReceiptPage from './pages/ReceiptPage';
import WaitingPage from './pages/WaitingPage';
import DashboardPage from './pages/DashboardPage';

function ProtectedRoute() {
  const { user, authInitialized } = useAuth();

  if (!authInitialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#0FA571', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/form',      element: <FormPage /> },
      { path: '/receipt',   element: <ReceiptPage /> },
      { path: '/waiting',   element: <WaitingPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
