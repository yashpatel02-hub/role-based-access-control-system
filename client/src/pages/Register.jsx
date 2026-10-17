import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Rocket, Mail, Lock, User, AtSign, UserPlus } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, username, password, confirmPassword } = formData;

    if (!name || !email || !username || !password) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, username, password });
      showToast('Registration successful! Welcome to ProAccess.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
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
          maxWidth: '460px',
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
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
            Join ProAccess to manage workspaces, projects, and permissions
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Full Name"
              name="name"
              icon={User}
              placeholder="e.g. Alex Henderson"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Username"
              name="username"
              icon={AtSign}
              placeholder="alexh"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              icon={Mail}
              placeholder="alex@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              icon={Lock}
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              icon={Lock}
              placeholder="Repeat password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={UserPlus}
              style={{ marginTop: '8px', width: '100%' }}
            >
              Register Account
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
