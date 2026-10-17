import React, { useState, useEffect, useCallback } from 'react';
import { auditService } from '../services/auditService';
import { useToast } from '../context/ToastContext';
import {
  ClipboardList,
  Search,
  Activity,
  Filter,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

const AuditLogs = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit, search };
      if (actionFilter !== 'all') params.action = actionFilter;

      const res = await auditService.getAuditLogs(params);
      if (res && res.data) {
        setLogs(res.data);
        setTotalCount(res.pagination?.totalItems || res.data.length);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, actionFilter, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeVariant = (action) => {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('ACTIVATED')) {
      return 'success';
    }
    if (action.includes('DELETED') || action.includes('REMOVED') || action.includes('DEACTIVATED')) {
      return 'danger';
    }
    if (action.includes('UPDATED') || action.includes('CHANGED')) {
      return 'warning';
    }
    if (action.includes('LOGIN')) {
      return 'primary';
    }
    return 'default';
  };

  const actionOptions = [
    'all',
    'LOGIN',
    'LOGOUT',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'USER_ACTIVATED',
    'USER_DEACTIVATED',
    'ROLE_CREATED',
    'ROLE_UPDATED',
    'ROLE_DELETED',
    'ROLE_CHANGED',
    'PROJECT_CREATED',
    'PROJECT_UPDATED',
    'PROJECT_DELETED',
    'MEMBER_ADDED',
    'MEMBER_UPDATED',
    'MEMBER_REMOVED',
    'PERMISSION_UPDATED',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Audit Trail & Security Logs ({totalCount})
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
          Immutable system-wide ledger tracking all authentication, authorization, and administrative events
        </p>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '300px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search description, IP, or action..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            {actionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'all' ? 'All Actions' : opt}
              </option>
            ))}
          </select>
        </div>

        {/* Logs Table */}
        {loading ? (
          <LoadingSpinner message="Querying audit records..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No audit entries"
            description="No system security logs match your current query criteria."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th style={{ padding: '14px 24px' }}>User</th>
                  <th style={{ padding: '14px 16px' }}>Event Action</th>
                  <th style={{ padding: '14px 16px' }}>Target</th>
                  <th style={{ padding: '14px 16px' }}>Description</th>
                  <th style={{ padding: '14px 16px' }}>IP Address</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar
                          src={log.user?.profileImage}
                          name={log.user?.name || 'System'}
                          size="xs"
                        />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.user ? log.user.name : 'System (Automated)'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {log.targetType ? `${log.targetType}` : '-'}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)', maxWidth: '340px' }}>
                      {log.description}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td style={{ padding: '14px 24px', textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default AuditLogs;
