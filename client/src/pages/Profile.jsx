import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import {
  User,
  Mail,
  AtSign,
  Shield,
  Calendar,
  Camera,
  Lock,
  Save,
  CheckCircle,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import RoleBadge from '../components/common/RoleBadge';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Profile = () => {
  const { user, updateUserProfile, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Edit profile info state
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [infoLoading, setInfoLoading] = useState(false);

  // Change password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);

  // Avatar upload state
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'warning');
      return;
    }
    try {
      setInfoLoading(true);
      await updateUserProfile({ name, about });
      showToast('Profile information updated successfully', 'success');
      await refreshUser();
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwords;
    if (!currentPassword || !newPassword) {
      showToast('Please fill out all password fields', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match', 'warning');
      return;
    }

    try {
      setPassLoading(true);
      await authService.changePassword(passwords);
      showToast('Password changed successfully', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPassLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5MB limit', 'warning');
      return;
    }

    // Validate format
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only JPG, PNG, and WebP images are supported', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadLoading(true);
      await authService.uploadAvatar(formData);
      showToast('Profile avatar updated successfully', 'success');
      await refreshUser();
    } catch (err) {
      showToast(err.message || 'Failed to upload profile picture', 'error');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Account & Profile Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Manage your personal credentials, identity avatar, and account security
        </p>
      </div>

      {/* Profile Overview Card with Avatar Upload */}
      <div
        className="card"
        style={{
          padding: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        {/* Avatar with Camera Icon Overlay */}
        <div style={{ position: 'relative' }}>
          <Avatar src={user?.profileImage} name={user?.name} size="xl" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            style={{
              position: 'absolute',
              bottom: '0px',
              right: '0px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-card)',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer',
            }}
            title="Upload profile picture"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* User Identity Details */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.name}
            </h2>
            <StatusBadge status={user?.status} size="sm" />
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            @{user?.username} • {user?.email}
          </div>

          {/* Assigned Roles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Assigned Roles:
            </span>
            {user?.roles?.map((r) => (
              <RoleBadge key={r} role={r} size="sm" />
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
        </div>
      </div>

      {/* Grid: Edit Profile Info & Change Password */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Personal Details Form */}
        <div className="card" style={{ padding: '24px' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '18px',
            }}
          >
            Personal Information
          </h3>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Full Name"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              icon={Mail}
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.7 }}
            />

            <Input
              label="Username"
              icon={AtSign}
              value={user?.username || ''}
              disabled
              style={{ opacity: 0.7 }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                About Me / Bio
              </label>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Brief professional background or role description..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              loading={infoLoading}
              style={{ alignSelf: 'flex-start', marginTop: '6px' }}
            >
              Save Profile
            </Button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card" style={{ padding: '24px' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '18px',
            }}
          >
            Change Account Password
          </h3>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Current Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />

            <Input
              label="New Password"
              type="password"
              icon={Lock}
              placeholder="Minimum 6 characters"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={Lock}
              placeholder="Repeat new password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              required
            />

            <Button
              type="submit"
              variant="secondary"
              size="md"
              icon={Lock}
              loading={passLoading}
              style={{ alignSelf: 'flex-start', marginTop: '6px' }}
            >
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
