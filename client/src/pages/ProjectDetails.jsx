import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { memberService } from '../services/memberService';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Users,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Shield,
  FolderKanban,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import RoleBadge from '../components/common/RoleBadge';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Select from '../components/common/Select';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Member Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [addForm, setAddForm] = useState({
    userId: '',
    roleId: '',
    accessExpiresAt: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Remove Member Confirm
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    member: null,
  });

  const fetchProjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectService.getProjectById(id);
      if (res && res.data) {
        setProject(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load project details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Load auxiliary data when opening add modal
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          userService.getUsers({ limit: 100 }),
          roleService.getRoles(),
        ]);
        if (usersRes?.data) setUsersList(usersRes.data);
        if (rolesRes?.data) setRolesList(rolesRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (addModalOpen) {
      loadAuxData();
    }
  }, [addModalOpen]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addForm.userId || !addForm.roleId) {
      showToast('Please select user and role', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await memberService.addMember(id, {
        userId: addForm.userId,
        roleId: addForm.roleId,
        accessExpiresAt: addForm.accessExpiresAt || null,
      });
      showToast('Member added to project', 'success');
      setAddModalOpen(false);
      setAddForm({ userId: '', roleId: '', accessExpiresAt: '' });
      fetchProjectDetails();
    } catch (err) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!deleteConfirm.member) return;
    try {
      setActionLoading(true);
      await memberService.removeMember(id, deleteConfirm.member._id);
      showToast('Member removed from project', 'success');
      setDeleteConfirm({ isOpen: false, member: null });
      fetchProjectDetails();
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading project details and team rosters..." />;
  }

  if (!project) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Project not found</h2>
        <Button variant="secondary" onClick={() => navigate('/projects')} style={{ marginTop: '16px' }}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const members = project.members || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>
      </div>

      {/* Project Overview Card */}
      <div className="card" style={{ padding: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {project.name}
              </h1>
              <StatusBadge status={project.status} size="md" />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '680px', lineHeight: 1.5 }}>
              {project.description || 'No description provided.'}
            </p>
          </div>

          {hasPermission('members.add') && (
            <Button variant="primary" size="md" icon={Plus} onClick={() => setAddModalOpen(true)}>
              Add Member
            </Button>
          )}
        </div>

        {/* Project Metadata */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '18px',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            Created by: <strong>{project.createdBy?.name || 'Administrator'}</strong>
          </div>
          <div>
            Total Team Members: <strong>{members.length}</strong>
          </div>
          <div>
            Created on: <strong>{new Date(project.createdAt).toLocaleDateString()}</strong>
          </div>
        </div>
      </div>

      {/* Project Members Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Assigned Project Members ({members.length})
          </h3>
        </div>

        {members.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No members have been assigned to this project yet.
          </div>
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
                  <th style={{ padding: '14px 24px' }}>Member</th>
                  <th style={{ padding: '14px 16px' }}>Project Role</th>
                  <th style={{ padding: '14px 16px' }}>Access Expiration</th>
                  <th style={{ padding: '14px 16px' }}>Assigned Date</th>
                  {hasPermission('members.remove') && (
                    <th style={{ padding: '14px 24px', textAlign: 'right' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isExpired = m.accessExpiresAt && new Date(m.accessExpiresAt) < new Date();
                  return (
                    <tr
                      key={m._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar src={m.user?.profileImage} name={m.user?.name || 'User'} size="sm" />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {m.user?.name || 'Deleted User'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              @{m.user?.username} • {m.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <RoleBadge role={m.role?.name || 'Member'} size="sm" />
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ color: isExpired ? '#ef4444' : 'var(--text-secondary)' }}>
                          {m.accessExpiresAt
                            ? `${new Date(m.accessExpiresAt).toLocaleDateString()}${
                                isExpired ? ' (Expired)' : ''
                              }`
                            : 'Permanent (No limit)'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(m.joinedAt || m.createdAt).toLocaleDateString()}
                      </td>

                      {hasPermission('members.remove') && (
                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, member: m })}
                            style={{
                              padding: '6px',
                              borderRadius: 'var(--radius-sm)',
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                            title="Remove member from project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={`Add Member to ${project.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddMember} loading={actionLoading}>
              Add Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select
            label="User"
            value={addForm.userId}
            onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
            options={[
              { value: '', label: '-- Select a user --' },
              ...usersList.map((u) => ({
                value: u._id,
                label: `${u.name} (@${u.username})`,
              })),
            ]}
            required
          />

          <Select
            label="Role in Project"
            value={addForm.roleId}
            onChange={(e) => setAddForm({ ...addForm, roleId: e.target.value })}
            options={[
              { value: '', label: '-- Select role --' },
              ...rolesList
                .filter((r) => isSuperAdmin || r.name !== 'Super Admin')
                .map((r) => ({
                  value: r._id,
                  label: r.name,
                })),
            ]}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Access Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={addForm.accessExpiresAt}
              onChange={(e) => setAddForm({ ...addForm, accessExpiresAt: e.target.value })}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, member: null })}
        onConfirm={handleRemoveMember}
        loading={actionLoading}
        title="Remove Member from Project"
        message={`Remove ${deleteConfirm.member?.user?.name || 'this member'} from ${project.name}?`}
        confirmText="Remove Member"
      />
    </div>
  );
};

export default ProjectDetails;
