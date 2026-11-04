import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SadAnalytics } from './pages/SadAnalytics';
import { Wallet } from './pages/Wallet';
import { Calendar } from './pages/Calendar';
import { Backoffice } from './pages/Backoffice';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside App Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sad" element={<SadAnalytics />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="calendar" element={<Calendar />} />
        <Route
          path="backoffice"
          element={
            <ProtectedRoute requireBackoffice>
              <Backoffice />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
