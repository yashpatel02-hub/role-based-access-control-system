import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  UserPlus,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  MoreVertical,
  X,
  Mail,
  User,
  Lock,
  AtSign,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import RoleBadge from '../components/common/RoleBadge';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Dropdown from '../components/common/Dropdown';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

const Users = () => {
  const { hasPermission, isSuperAdmin, user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Roles list
  const [rolesList, setRolesList] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    roles: [],
    status: 'active',
    about: '',
  });

  // Confirm delete or status change
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete', // 'delete' or 'status'
    user: null,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit, search };
      if (selectedRole !== 'all') params.role = selectedRole;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await userService.getUsers(params);
      if (res && res.data) {
        setUsers(res.data);
        setTotalCount(res.pagination?.totalItems || res.data.length);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedRole, selectedStatus, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await roleService.getRoles();
        if (res?.data) setRolesList(res.data);
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    const defaultRole = rolesList.find((r) => r.name === 'Developer') || rolesList[0];
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      roles: defaultRole ? [defaultRole._id] : [],
      status: 'active',
      about: '',
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '', // Leave blank unless updating
      roles: user.roles?.map((r) => r._id) || [],
      status: user.status,
      about: user.about || '',
    });
    setEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }
    try {
      setActionLoading(true);
      await userService.createUser(formData);
      showToast('User created successfully', 'success');
      setCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setActionLoading(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        roles: formData.roles,
        status: formData.status,
        about: formData.about,
      };
      if (formData.password && formData.password.trim().length >= 6) {
        payload.password = formData.password.trim();
      }
      await userService.updateUser(editingUser._id, payload);
      showToast('User updated successfully', 'success');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.user) return;
    try {
      setActionLoading(true);
      if (confirmDialog.type === 'delete') {
        await userService.deleteUser(confirmDialog.user._id);
        showToast('User deleted successfully', 'success');
      } else if (confirmDialog.type === 'status') {
        const nextStatus = confirmDialog.user.status === 'active' ? 'inactive' : 'active';
        await userService.changeStatus(confirmDialog.user._id, nextStatus);
        showToast(`User marked as ${nextStatus}`, 'success');
      }
      setConfirmDialog({ isOpen: false, type: 'delete', user: null });
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRoleSelection = (roleId) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleId);
      return {
        ...prev,
        roles: exists ? prev.roles.filter((id) => id !== roleId) : [...prev.roles, roleId],
      };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
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
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            User Management ({totalCount})
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Control user profiles, assigned system roles, and account statuses
          </p>
        </div>

        {hasPermission('users.create') && (
          <Button variant="primary" size="md" icon={UserPlus} onClick={handleOpenCreate}>
            Add User
          </Button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Search */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '280px',
            }}
          >
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
              placeholder="Search by name, email, or @user..."
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
                style={{
                  position: 'absolute',
                  right: '10px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Roles</option>
              {rolesList.map((r) => (
                <option key={r._id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <LoadingSpinner message="Loading user directory..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={User}
            title="No users found"
            description="No user accounts matched your search or filters."
            actionLabel={hasPermission('users.create') ? 'Create New User' : null}
            onAction={handleOpenCreate}
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
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th style={{ padding: '16px 24px' }}>User</th>
                  <th style={{ padding: '16px 16px' }}>Roles</th>
                  <th style={{ padding: '16px 16px' }}>Status</th>
                  <th style={{ padding: '16px 16px' }}>Joined Date</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u._id === currentUser?._id;
                  const isSuperAdminUser = u.roles?.some((r) => r.name === 'Super Admin');

                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      {/* User Info */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <Avatar src={u.profileImage} name={u.name} size="md" />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {u.name}
                              </span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    fontWeight: 600,
                                  }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              @{u.username} • {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {u.roles?.map((r) => (
                            <RoleBadge key={r._id || r} role={r} size="sm" />
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 16px' }}>
                        <StatusBadge status={u.status} size="sm" />
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '16px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {hasPermission('users.edit') && (
                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Edit user details"
                              style={{
                                padding: '6px',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {hasPermission('users.status') && !isSelf && (
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  type: 'status',
                                  user: u,
                                })
                              }
                              title={u.status === 'active' ? 'Deactivate account' : 'Activate account'}
                              style={{
                                padding: '6px',
                                borderRadius: 'var(--radius-sm)',
                                color: u.status === 'active' ? '#ef4444' : '#10b981',
                              }}
                            >
                              {u.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            </button>
                          )}

                          {hasPermission('users.delete') && !isSelf && (
                            <button
                              disabled={isSuperAdminUser && !isSuperAdmin}
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  type: 'delete',
                                  user: u,
                                })
                              }
                              title="Delete user"
                              style={{
                                padding: '6px',
                                borderRadius: 'var(--radius-sm)',
                                color: '#ef4444',
                                opacity: isSuperAdminUser && !isSuperAdmin ? 0.3 : 1,
                                cursor: isSuperAdminUser && !isSuperAdmin ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={actionLoading}>
              Create User
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Sarah Connor"
            required
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="sconnor@example.com"
            required
          />

          <Input
            label="Username"
            icon={AtSign}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="sconnor"
            required
          />

          <Input
            label="Initial Password"
            type="password"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 6 characters"
            required
          />

          {/* Role selection checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Assign Roles
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {rolesList
                .filter((r) => isSuperAdmin || r.name !== 'Super Admin')
                .map((r) => {
                  const checked = formData.roles.includes(r._id);
                  return (
                    <button
                      type="button"
                      key={r._id}
                      onClick={() => toggleRoleSelection(r._id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: checked ? 'var(--primary-light)' : 'var(--bg-input)',
                        border: checked ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        color: checked ? 'var(--primary)' : 'var(--text-primary)',
                        fontSize: '0.8125rem',
                        fontWeight: checked ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <input type="checkbox" readOnly checked={checked} style={{ accentColor: 'var(--primary)' }} />
                      <span>{r.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit User: ${editingUser?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={actionLoading}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Username"
            icon={AtSign}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <Input
            label="New Password (Optional)"
            type="password"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Leave blank to keep current password"
          />

          {/* Roles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Assigned Roles
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {rolesList
                .filter((r) => isSuperAdmin || r.name !== 'Super Admin')
                .map((r) => {
                  const checked = formData.roles.includes(r._id);
                  return (
                    <button
                      type="button"
                      key={r._id}
                      onClick={() => toggleRoleSelection(r._id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: checked ? 'var(--primary-light)' : 'var(--bg-input)',
                        border: checked ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        color: checked ? 'var(--primary)' : 'var(--text-primary)',
                        fontSize: '0.8125rem',
                        fontWeight: checked ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <input type="checkbox" readOnly checked={checked} style={{ accentColor: 'var(--primary)' }} />
                      <span>{r.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <Select
            label="Account Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive (Deactivated)' },
            ]}
          />
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete', user: null })}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        title={
          confirmDialog.type === 'delete'
            ? `Delete User Account: ${confirmDialog.user?.name}`
            : confirmDialog.user?.status === 'active'
            ? `Deactivate User: ${confirmDialog.user?.name}`
            : `Activate User: ${confirmDialog.user?.name}`
        }
        message={
          confirmDialog.type === 'delete'
            ? 'Are you sure you want to permanently delete this user? All their project memberships will also be revoked.'
            : confirmDialog.user?.status === 'active'
            ? 'Deactivating this user will prevent them from signing in and accessing any projects.'
            : 'Activating this user will restore their sign-in capabilities and project access.'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete Account'
            : confirmDialog.user?.status === 'active'
            ? 'Deactivate'
            : 'Activate'
        }
        variant={confirmDialog.type === 'delete' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default Users;
