import React, { useState, useEffect, useCallback } from 'react';
import { roleService } from '../services/roleService';
import { permissionService } from '../services/permissionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  Key,
  Lock,
  Check,
  Info,
} from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RoleBadge from '../components/common/RoleBadge';
import Input from '../components/common/Input';

const Roles = () => {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [roles, setRoles] = useState([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm delete
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    role: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        permissionService.getPermissions(),
      ]);

      if (rolesRes?.data) setRoles(rolesRes.data);
      if (permsRes?.grouped) setPermissionsGrouped(permsRes.grouped);
      if (permsRes?.data) setAllPermissions(permsRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to load roles and permissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map((p) => p._id || p) || [],
    });
    setModalOpen(true);
  };

  const togglePermission = (permId) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((id) => id !== permId)
          : [...prev.permissions, permId],
      };
    });
  };

  const toggleModulePermissions = (moduleName) => {
    const modulePerms = permissionsGrouped[moduleName] || [];
    const modulePermIds = modulePerms.map((p) => p._id);
    const allSelected = modulePermIds.every((id) => formData.permissions.includes(id));

    setFormData((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((id) => !modulePermIds.includes(id))
        : Array.from(new Set([...prev.permissions, ...modulePermIds])),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Role name is required', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      if (editingRole) {
        await roleService.updateRole(editingRole._id, formData);
        showToast(`Role "${formData.name}" updated successfully`, 'success');
      } else {
        await roleService.createRole(formData);
        showToast(`Role "${formData.name}" created successfully`, 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to save role', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.role) return;
    try {
      setActionLoading(true);
      await roleService.deleteRole(deleteDialog.role._id);
      showToast(`Role "${deleteDialog.role.name}" deleted successfully`, 'success');
      setDeleteDialog({ isOpen: false, role: null });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete role', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading RBAC roles and permissions schema..." />;
  }

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
            Role Management ({roles.length})
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Define role boundaries and assign specific granular system permissions
          </p>
        </div>

        {hasPermission('roles.create') && (
          <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
            Create Role
          </Button>
        )}
      </div>

      {/* Role Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {roles.map((role) => {
          const isSystem = role.isSystem;
          const isSuperAdminRole = role.name === 'Super Admin';

          return (
            <div
              key={role._id}
              className="card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <RoleBadge role={role.name} size="lg" />
                  {isSystem && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-active)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      System Built-in
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: '42px' }}>
                  {role.description || 'No description provided.'}
                </p>
              </div>

              {/* Stats badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} style={{ color: 'var(--primary)' }} />
                  <span>
                    <strong>{role.userCount || 0}</strong> Users
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} style={{ color: '#10b981' }} />
                  <span>
                    <strong>{role.permissionCount || role.permissions?.length || 0}</strong> Permissions
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '14px',
                }}
              >
                {hasPermission('roles.edit') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(role)}
                    disabled={isSuperAdminRole && !isSuperAdmin}
                  >
                    Edit
                  </Button>
                )}

                {hasPermission('roles.delete') && !isSystem && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setDeleteDialog({ isOpen: true, role })}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Role Modal with Grouped Permissions Checkboxes */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="680px"
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={actionLoading}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Security Auditor"
            disabled={editingRole?.name === 'Super Admin'}
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief explanation of what access this role grants"
          />

          {/* Grouped Permissions Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Permissions (Grouped by Module)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formData.permissions.length} selected
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '360px',
                overflowY: 'auto',
                paddingRight: '6px',
              }}
            >
              {Object.keys(permissionsGrouped).map((moduleName) => {
                const perms = permissionsGrouped[moduleName] || [];
                const allModuleChecked = perms.every((p) => formData.permissions.includes(p._id));

                return (
                  <div
                    key={moduleName}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-hover)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Module Title Header with Toggle All */}
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--primary)',
                        }}
                      >
                        {moduleName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(moduleName)}
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {allModuleChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {/* Permissions list checkboxes */}
                    <div
                      style={{
                        padding: '12px 14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      {perms.map((perm) => {
                        const checked = formData.permissions.includes(perm._id);
                        return (
                          <label
                            key={perm._id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(perm._id)}
                              style={{
                                marginTop: '2px',
                                accentColor: 'var(--primary)',
                                cursor: 'pointer',
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: checked ? 600 : 400 }}>{perm.name}</div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                {perm.description}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Role Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, role: null })}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title={`Delete Role: ${deleteDialog.role?.name}`}
        message="Are you sure you want to delete this custom role? This action cannot be undone."
        confirmText="Delete Role"
      />
    </div>
  );
};

export default Roles;
