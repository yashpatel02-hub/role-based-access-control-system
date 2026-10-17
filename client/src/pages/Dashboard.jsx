import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  FolderKanban,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Clock,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Avatar from '../components/common/Avatar';
import RoleBadge from '../components/common/RoleBadge';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getStats();
        if (res && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Fetching live MongoDB access metrics..." />;
  }

  const counts = data?.counts || {};
  const recentUsers = data?.recentUsers || [];
  const recentProjects = data?.recentProjects || [];
  const recentActivities = data?.recentActivities || [];
  const roleDistribution = data?.roleDistribution || [];

  const statCards = [
    {
      title: 'Total Users',
      value: counts.totalUsers || 0,
      subValue: `${counts.activeUsers || 0} active`,
      icon: Users,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      path: '/users',
    },
    {
      title: 'Active Projects',
      value: counts.activeProjects || 0,
      subValue: `of ${counts.totalProjects || 0} total`,
      icon: FolderKanban,
      color: '#0284c7',
      bg: '#e0f2fe',
      path: '/projects',
    },
    {
      title: 'Configured Roles',
      value: counts.totalRoles || 0,
      subValue: 'RBAC defined roles',
      icon: Shield,
      color: '#16a34a',
      bg: '#dcfce7',
      path: '/roles',
    },
    {
      title: 'Expiring Access',
      value: counts.expiringSoonCount || 0,
      subValue: `${counts.expiredCount || 0} already expired`,
      icon: Clock,
      color: '#d97706',
      bg: '#fef3c7',
      path: '/members',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome back, {user?.name || 'Administrator'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Here is your live organization access overview and system security telemetry.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasPermission('members.add') && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => navigate('/members')}
            >
              Add Member
            </Button>
          )}
          {hasPermission('projects.create') && (
            <Button
              variant="secondary"
              size="md"
              icon={Plus}
              onClick={() => navigate('/projects')}
            >
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="card"
              onClick={() => card.path && navigate(card.path)}
              style={{
                padding: '22px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {card.title}
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: card.bg,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {card.subValue}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Projects, Users, Activities */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Recent Projects */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Projects
            </h3>
            <button
              onClick={() => navigate('/projects')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentProjects.map((p) => (
              <div
                key={p._id}
                onClick={() => navigate(`/projects/${p._id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-hover)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Created by {p.createdBy?.name || 'Administrator'}
                  </div>
                </div>
                <StatusBadge status={p.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Role Distribution
            </h3>
            <button
              onClick={() => navigate('/roles')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              Manage roles <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
            {roleDistribution.map((role) => {
              const percentage =
                counts.totalUsers > 0 ? Math.round((role.userCount / counts.totalUsers) * 100) : 0;
              return (
                <div key={role.roleId} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{role.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {role.userCount} users ({percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: 'var(--bg-active)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: 'var(--primary)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Security Audit
            </h3>
            <button
              onClick={() => navigate('/audit-logs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              Full log <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentActivities.map((log) => (
              <div
                key={log._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    marginTop: '2px',
                  }}
                >
                  <Activity size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                  >
                    {log.description}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      marginTop: '3px',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
