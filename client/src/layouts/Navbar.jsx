import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  User,
  Settings,
  LogOut,
  ChevronDown,
  FolderPlus,
  UserPlus,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import RoleBadge from '../components/common/RoleBadge';
import Dropdown from '../components/common/Dropdown';
import Button from '../components/common/Button';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/users?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-navbar)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 80,
      }}
    >
      {/* Left side: Hamburger toggle & Quick links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
          className="hamburger-btn"
        >
          <Menu size={20} />
        </button>

        {/* Quick Nav Items (like reference screenshot) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }} className="nav-shortcuts">
          <button
            onClick={() => navigate('/projects')}
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Projects <ChevronDown size={14} />
          </button>
          <button
            onClick={() => navigate('/members')}
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Groups <ChevronDown size={14} />
          </button>
          <button
            onClick={() => navigate('/roles')}
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Access Roles <ChevronDown size={14} />
          </button>
        </div>

        {/* Create Quick Action Dropdown */}
        <Dropdown
          align="left"
          width="180px"
          trigger={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              style={{ borderRadius: 'var(--radius-md)', padding: '6px 14px' }}
            >
              Create
            </Button>
          }
        >
          {({ close }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {hasPermission('members.add') && (
                <button
                  onClick={() => {
                    close();
                    navigate('/members');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <UserPlus size={16} style={{ color: 'var(--primary)' }} />
                  <span>Add Member</span>
                </button>
              )}
              {hasPermission('projects.create') && (
                <button
                  onClick={() => {
                    close();
                    navigate('/projects');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <FolderPlus size={16} style={{ color: 'var(--primary)' }} />
                  <span>New Project</span>
                </button>
              )}
            </div>
          )}
        </Dropdown>
      </div>

      {/* Right side: Search, Theme Toggle, Notification, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick Search */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '200px',
          }}
          className="navbar-search"
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearch}
            style={{
              width: '100%',
              padding: '6px 12px 6px 30px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
            }}
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Notifications Icon */}
        <button
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Notifications"
        >
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
            }}
          />
        </button>

        {/* User Profile Dropdown */}
        {user && (
          <Dropdown
            align="right"
            width="220px"
            trigger={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Avatar src={user.profileImage} name={user.name} size="sm" />
              </div>
            }
          >
            {({ close }) => (
              <div>
                {/* User info header */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.email}
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <RoleBadge role={user.roles?.[0] || 'User'} size="sm" />
                  </div>
                </div>

                {/* Dropdown options */}
                <div style={{ padding: '4px 0' }}>
                  <button
                    onClick={() => {
                      close();
                      navigate('/profile');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      fontSize: '0.8125rem',
                      color: 'var(--text-primary)',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <User size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      close();
                      navigate('/settings');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      fontSize: '0.8125rem',
                      color: 'var(--text-primary)',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <Settings size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span>Settings</span>
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      close();
                      handleLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      fontSize: '0.8125rem',
                      color: '#ef4444',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </Dropdown>
        )}
      </div>
    </header>
  );
};

export default Navbar;
