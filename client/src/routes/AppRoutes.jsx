import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layout
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Members from '../pages/Members';
import Projects from '../pages/Projects';
import ProjectDetails from '../pages/ProjectDetails';
import Users from '../pages/Users';
import Roles from '../pages/Roles';
import Permissions from '../pages/Permissions';
import AuditLogs from '../pages/AuditLogs';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage message="Initializing ProAccess security context..." />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected Routes wrapped in MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredPermission="dashboard.view">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="members"
          element={
            <ProtectedRoute requiredPermission="members.view">
              <Members />
            </ProtectedRoute>
          }
        />

        <Route
          path="projects"
          element={
            <ProtectedRoute requiredPermission="projects.view">
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path="projects/:id"
          element={
            <ProtectedRoute requiredPermission="projects.view">
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute requiredPermission="users.view">
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="roles"
          element={
            <ProtectedRoute requiredPermission="roles.view">
              <Roles />
            </ProtectedRoute>
          }
        />

        <Route
          path="permissions"
          element={
            <ProtectedRoute requiredPermission="permissions.view">
              <Permissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="audit-logs"
          element={
            <ProtectedRoute requiredPermission="audit.view">
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="profile"
          element={
            <ProtectedRoute requiredPermission="profile.view">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export default AppRoutes;
