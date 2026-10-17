import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ShieldAlert } from 'lucide-react';
import Button from './Button';

const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage message="Verifying authentication & security clearances..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            marginBottom: '16px',
          }}
        >
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
          403 - Access Forbidden
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
          You do not have the required role ({requiredRole}) to access this page.
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            marginBottom: '16px',
          }}
        >
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
          403 - Permission Denied
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
          Your account is missing the required permission: <code>{requiredPermission}</code>.
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
