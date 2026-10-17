import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Database, Shield, Monitor } from 'lucide-react';
import Button from '../components/common/Button';
import RoleBadge from '../components/common/RoleBadge';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isSuperAdmin, permissions } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          System & Workspace Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Configure theme preferences, session security, and review environment parameters
        </p>
      </div>

      {/* Theme Settings Card */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Appearance Theme
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Select your preferred visual mode. Your preference is persisted in browser storage.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Light Mode Option */}
          <div
            onClick={() => theme === 'dark' && toggleTheme()}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${theme === 'light' ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: '#ffffff',
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: theme === 'light' ? 'var(--shadow-md)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Sun size={20} style={{ color: '#f59e0b' }} />
              {theme === 'light' && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                  }}
                >
                  Active
                </span>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Light Mode</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Soft lavender accents with crisp clean background
              </div>
            </div>
          </div>

          {/* Dark Mode Option */}
          <div
            onClick={() => theme === 'light' && toggleTheme()}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${theme === 'dark' ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: '#131722',
              color: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: theme === 'dark' ? 'var(--shadow-md)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Moon size={20} style={{ color: '#818cf8' }} />
              {theme === 'dark' && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                  }}
                >
                  Active
                </span>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Dark Mode</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Midnight sleek design with high contrast glowing accents
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Review Card */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Current Security Clearance
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Active session credentials and resolved permissions for your logged-in account
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Authentication Method</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Session Cookie (HTTP-Only, Express-Session, Connect-Mongo)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Roles Assigned</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {user?.roles?.map((r) => (
                <RoleBadge key={r} role={r} size="sm" />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Super Admin Status</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isSuperAdmin ? '#10b981' : 'var(--text-secondary)' }}>
              {isSuperAdmin ? 'Full Bypass & Clearance Enabled' : 'Role-Restricted'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Granted Atomic Permissions ({permissions?.length || 0}):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {permissions?.map((p) => (
                <span
                  key={p}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-active)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Database Info Card */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Infrastructure & Compass Integration
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <p>
            • <strong>Local MongoDB URI:</strong> <code>mongodb://127.0.0.1:27017/accesshub</code>
          </p>
          <p>
            • <strong>MongoDB Compass Target:</strong> <code>mongodb://127.0.0.1:27017</code> (Database: <code>accesshub</code>)
          </p>
          <p>
            • <strong>Backend API Port:</strong> <code>http://localhost:5000</code>
          </p>
          <p>
            • <strong>Frontend Vite Port:</strong> <code>http://localhost:5173</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
