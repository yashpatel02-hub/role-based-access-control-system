import React, { useState, useEffect, useCallback } from 'react';
import { permissionService } from '../services/permissionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Key, Plus, Edit2, Trash2, ShieldCheck, Lock } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

const Permissions = () => {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [permissionsGrouped, setPermissionsGrouped] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: 'users',
    action: 'view',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm delete
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    perm: null,
  });

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await permissionService.getPermissions();
      if (res && res.grouped) {
        setPermissionsGrouped(res.grouped);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleOpenCreate = () => {
    setEditingPerm(null);
    setFormData({
      name: '',
      description: '',
      module: 'users',
      action: 'view',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (perm) => {
    setEditingPerm(perm);
    setFormData({
      name: perm.name,
      description: perm.description || '',
      module: perm.module,
      action: perm.action,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.module.trim() || !formData.action.trim()) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      if (editingPerm) {
        await permissionService.updatePermission(editingPerm._id, formData);
        showToast('Permission updated successfully', 'success');
      } else {
        await permissionService.createPermission(formData);
        showToast('Permission created successfully', 'success');
      }
      setModalOpen(false);
      fetchPermissions();
    } catch (err) {
      showToast(err.message || 'Failed to save permission', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.perm) return;
    try {
      setActionLoading(true);
      await permissionService.deletePermission(deleteDialog.perm._id);
      showToast('Permission deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, perm: null });
      fetchPermissions();
    } catch (err) {
      showToast(err.message || 'Failed to delete permission', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Fetching granular system permissions..." />;
  }

  const moduleNames = Object.keys(permissionsGrouped);
  const totalCount = moduleNames.reduce((acc, m) => acc + permissionsGrouped[m].length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            System Permissions ({totalCount})
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            System-wide atomic permissions grouped into logical functional modules
          </p>
        </div>

        {isSuperAdmin && (
          <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
            New Permission
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid rgba(108, 92, 231, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            color: 'var(--primary)',
          }}
        >
          <Lock size={16} />
          <span>
            Only <strong>Super Administrators</strong> can modify or add system-level permissions.
          </span>
        </div>
      )}

      {/* Grouped Modules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {moduleNames.map((mod) => {
          const perms = permissionsGrouped[mod] || [];
          return (
            <div key={mod} className="card" style={{ overflow: 'hidden' }}>
              {/* Module Header */}
              <div
                style={{
                  padding: '16px 24px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {mod}
                  </span>
                  <Badge variant="primary" size="sm">
                    {perms.length} actions
                  </Badge>
                </div>
              </div>

              {/* Table of Permissions inside Module */}
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
                      <th style={{ padding: '12px 24px' }}>Permission Key</th>
                      <th style={{ padding: '12px 16px' }}>Description</th>
                      <th style={{ padding: '12px 16px' }}>Action Type</th>
                      {isSuperAdmin && <th style={{ padding: '12px 24px', textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {perms.map((p) => (
                      <tr
                        key={p._id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <td style={{ padding: '14px 24px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {p.description || '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Badge variant="info" size="sm">
                            {p.action}
                          </Badge>
                        </td>
                        {isSuperAdmin && (
                          <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                style={{
                                  padding: '4px',
                                  color: 'var(--text-secondary)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => setDeleteDialog({ isOpen: true, perm: p })}
                                style={{
                                  padding: '4px',
                                  color: '#ef4444',
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPerm ? `Edit Permission: ${editingPerm.name}` : 'New Permission'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={actionLoading}>
              Save Permission
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Permission Key (e.g. reports.view)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="module.action"
            disabled={Boolean(editingPerm)}
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What capability does this permission authorize?"
            required
          />

          <Select
            label="Module"
            value={formData.module}
            onChange={(e) => setFormData({ ...formData, module: e.target.value })}
            options={[
              { value: 'users', label: 'Users' },
              { value: 'roles', label: 'Roles' },
              { value: 'permissions', label: 'Permissions' },
              { value: 'projects', label: 'Projects' },
              { value: 'members', label: 'Members' },
              { value: 'dashboard', label: 'Dashboard' },
              { value: 'profile', label: 'Profile' },
              { value: 'audit', label: 'Audit' },
            ]}
          />

          <Select
            label="Action"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            options={[
              { value: 'view', label: 'View (Read)' },
              { value: 'create', label: 'Create' },
              { value: 'edit', label: 'Edit (Update)' },
              { value: 'delete', label: 'Delete' },
              { value: 'manage', label: 'Manage (All Operations)' },
              { value: 'status', label: 'Status' },
            ]}
          />
        </form>
      </Modal>

      {/* Delete Permission Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, perm: null })}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title={`Delete Permission: ${deleteDialog.perm?.name}`}
        message="Deleting this permission will immediately revoke it from all roles in the system."
        confirmText="Delete Permission"
      />
    </div>
  );
};

export default Permissions;
