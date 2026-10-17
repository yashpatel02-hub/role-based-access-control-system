import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Calendar,
  Edit2,
  Trash2,
  ExternalLink,
  X,
} from 'lucide-react';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

const Projects = () => {
  const { hasPermission } = useAuth();
  const { refreshProjects } = useProjects();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Confirm
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    project: null,
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit, search };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await projectService.getProjects(params);
      if (res && res.data) {
        setProjectsList(res.data);
        setTotalCount(res.pagination?.totalItems || res.data.length);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Project name is required', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      if (editingProject) {
        await projectService.updateProject(editingProject._id, formData);
        showToast('Project updated successfully', 'success');
      } else {
        await projectService.createProject(formData);
        showToast('Project created successfully', 'success');
      }
      setModalOpen(false);
      fetchProjects();
      refreshProjects();
    } catch (err) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.project) return;
    try {
      setActionLoading(true);
      await projectService.deleteProject(deleteDialog.project._id);
      showToast('Project deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, project: null });
      fetchProjects();
      refreshProjects();
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setActionLoading(false);
    }
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
            Project Directory ({totalCount})
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage team access domains, workspaces, and member assignments
          </p>
        </div>

        {hasPermission('projects.create') && (
          <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
            New Project
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '280px' }}>
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
            placeholder="Search projects..."
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <LoadingSpinner message="Loading projects..." />
      ) : projectsList.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Create your first project to start assigning team members and managing permissions."
          actionLabel={hasPermission('projects.create') ? 'Create Project' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {projectsList.map((project) => (
            <div
              key={project._id}
              className="card"
              onClick={() => navigate(`/projects/${project._id}`)}
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '10px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {project.name}
                  </h3>
                  <StatusBadge status={project.status} size="sm" />
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    minHeight: '42px',
                  }}
                >
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Project Meta Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                    <strong>{project.memberCount || 0}</strong> Members
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '14px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  By {project.createdBy?.name || 'Administrator'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {hasPermission('projects.edit') && (
                    <button
                      onClick={(e) => handleOpenEdit(project, e)}
                      title="Edit project"
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      <Edit2 size={15} />
                    </button>
                  )}

                  {hasPermission('projects.delete') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog({ isOpen: true, project });
                      }}
                      title="Delete project"
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: '#ef4444',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/projects/${project._id}`)}
                    title="View project members & details"
                    style={{
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--primary)',
                    }}
                  >
                    <ExternalLink size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        limit={limit}
        onPageChange={(p) => setPage(p)}
      />

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? `Edit Project: ${editingProject.name}` : 'Create New Project'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={actionLoading}>
              {editingProject ? 'Save Project' : 'Create Project'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. NextGen Microservices Gateway"
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is the objective or scope of this project?"
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

          <Select
            label="Project Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active (In Progress)' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </form>
      </Modal>

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, project: null })}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title={`Delete Project: ${deleteDialog.project?.name}`}
        message="Deleting this project will permanently remove all associated member roles and access permissions. This action cannot be undone."
        confirmText="Delete Project"
      />
    </div>
  );
};

export default Projects;
