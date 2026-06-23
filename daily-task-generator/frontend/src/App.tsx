import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import BacklogPage from './pages/BacklogPage';
import SprintsPage from './pages/SprintsPage';
import StandupPage from './pages/StandupPage';
import RetrospectivePage from './pages/RetrospectivePage';
import ChatPage from './pages/ChatPage';
import MembersPage from './pages/MembersPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/layout/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="board/:projectId?" element={<BoardPage />} />
        <Route path="backlog/:projectId?" element={<BacklogPage />} />
        <Route path="sprints/:projectId?" element={<SprintsPage />} />
        <Route path="standup/:projectId?" element={<StandupPage />} />
        <Route path="retrospective/:projectId?" element={<RetrospectivePage />} />
        <Route path="chat/:projectId?" element={<ChatPage />} />
        <Route path="members/:projectId?" element={<MembersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="reports/:projectId?" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

export default App;