import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Rocket, Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    try {
      setLoading(true);
      await login({ email, password });
      showToast('Login successful! Welcome back.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(108, 92, 231, 0.35)',
            }}
          >
            <Rocket size={26} />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome to Pro<span style={{ color: 'var(--primary)' }}>Access</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
            Enterprise Role-Based Access Control & Project Governance
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={LogIn}
              style={{ marginTop: '6px', width: '100%' }}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
              <span>Quick Test Roles</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@example.com', 'Admin@123')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sarah.admin@accesshub.io', 'Password@123')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('marcus.manager@accesshub.io', 'Password@123')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('elena.dev@accesshub.io', 'Password@123')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                Developer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('maya.viewer@accesshub.io', 'Password@123')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                Viewer
              </button>
            </div>
          </div>
        </div>

        {/* Registration footer */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
