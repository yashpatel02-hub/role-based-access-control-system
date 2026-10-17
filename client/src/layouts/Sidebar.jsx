import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCheck,
  Shield,
  Key,
  ClipboardList,
  User,
  Settings,
  Rocket,
  ChevronDown,
  X,
} from 'lucide-react';
import Dropdown from '../components/common/Dropdown';

const Sidebar = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();
  const { projects, currentProject, setCurrentProject } = useProjects();
  const navigate = useNavigate();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard.view',
    },
    {
      label: 'Projects',
      path: '/projects',
      icon: FolderKanban,
      permission: 'projects.view',
    },
    {
      label: 'Members',
      path: '/members',
      icon: Users,
      permission: 'members.view',
    },
    {
      label: 'Users',
      path: '/users',
      icon: UserCheck,
      permission: 'users.view',
    },
    {
      label: 'Roles',
      path: '/roles',
      icon: Shield,
      permission: 'roles.view',
    },
    {
      label: 'Permissions',
      path: '/permissions',
      icon: Key,
      permission: 'permissions.view',
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: ClipboardList,
      permission: 'audit.view',
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: User,
      permission: 'profile.view',
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      permission: null, // Always available
    },
  ];

  // Filter based on user's permissions
  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 90,
            backdropFilter: 'blur(2px)',
          }}
          className="sidebar-backdrop"
        />
      )}

      <aside
        style={{
          width: '240px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
          transition: 'transform var(--transition-normal)',
        }}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      >
        {/* App Logo */}
        <div
          style={{
            padding: '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(108, 92, 231, 0.35)',
              }}
            >
              <Rocket size={20} />
            </div>
            <span
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Pro<span style={{ color: 'var(--primary)' }}>Access</span>
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              display: 'none',
              padding: '4px',
              color: 'var(--text-secondary)',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Project Selector (Directly matching reference UI) */}
        <div style={{ padding: '0 16px 14px 16px' }}>
          <Dropdown
            width="208px"
            trigger={({ isOpen }) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    P
                  </div>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentProject ? currentProject.name : 'Select Project'}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </div>
            )}
          >
            {({ close }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Switch Project
                </div>
                {projects.map((proj) => (
                  <button
                    key={proj._id}
                    onClick={() => {
                      setCurrentProject(proj);
                      close();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor:
                        currentProject?._id === proj._id ? 'var(--primary-light)' : 'transparent',
                      color:
                        currentProject?._id === proj._id ? 'var(--primary)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span style={{ fontWeight: currentProject?._id === proj._id ? 600 : 400 }}>
                      {proj.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Dropdown>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto',
          }}
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(108, 92, 231, 0.3)' : 'none',
                  transition: 'all var(--transition-fast)',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>ProAccess v1.0</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            Online
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
