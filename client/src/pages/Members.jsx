import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { memberService } from '../services/memberService';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import {
  Search,
  Plus,
  ChevronDown,
  Calendar,
  X,
  Trash2,
  Check,
  Edit2,
  Users as UsersIcon,
  Shield,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Dropdown from '../components/common/Dropdown';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Select from '../components/common/Select';
import Pagination from '../components/common/Pagination';

const Members = () => {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { currentProject, projects } = useProjects();
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination state
  const [tab, setTab] = useState('all'); // 'all', 'members', 'groups'
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState('account');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [addForm, setAddForm] = useState({
    userId: '',
    roleId: '',
    projectId: currentProject?._id || '',
    accessExpiresAt: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    member: null,
  });

  // Fetch Members
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search,
        tab,
        sort: sortBy,
      };

      if (currentProject?._id) {
        params.project = currentProject._id;
      }

      if (selectedRole !== 'all') {
        params.role = selectedRole;
      }

      const res = await memberService.getMembers(params);
      if (res && res.data) {
        setMembers(res.data);
        setTotalCount(res.pagination?.totalItems || res.data.length);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load project members', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, tab, sortBy, currentProject, selectedRole, showToast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Load users & roles for add modal
  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [rolesRes, usersRes] = await Promise.all([
          roleService.getRoles(),
          userService.getUsers({ limit: 100 }),
        ]);
        if (rolesRes?.data) setRolesList(rolesRes.data);
        if (usersRes?.data) setUsersList(usersRes.data);
      } catch (err) {
        console.error('Failed to load auxiliary data:', err);
      }
    };
    if (addModalOpen) {
      loadAuxData();
    }
  }, [addModalOpen]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(members.map((m) => m._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add Member submit
  const handleAddMember = async (e) => {
    e.preventDefault();
    const projId = addForm.projectId || currentProject?._id;
    if (!projId || !addForm.userId || !addForm.roleId) {
      showToast('Please select project, user, and role', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await memberService.addMember(projId, {
        userId: addForm.userId,
        roleId: addForm.roleId,
        accessExpiresAt: addForm.accessExpiresAt || null,
      });
      showToast('Member added successfully', 'success');
      setAddModalOpen(false);
      setAddForm({
        userId: '',
        roleId: '',
        projectId: currentProject?._id || '',
        accessExpiresAt: '',
      });
      fetchMembers();
    } catch (err) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Role Change from row dropdown
  const handleRoleChange = async (member, newRoleId) => {
    try {
      await memberService.updateMember(member.project?._id || currentProject?._id, member._id, {
        roleId: newRoleId,
      });
      showToast(`Role updated for ${member.user?.name}`, 'success');
      fetchMembers();
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  // Quick Expiration clear/set
  const handleClearExpiration = async (member) => {
    try {
      await memberService.updateMember(member.project?._id || currentProject?._id, member._id, {
        accessExpiresAt: null,
      });
      showToast('Expiration date removed', 'success');
      fetchMembers();
    } catch (err) {
      showToast(err.message || 'Failed to update expiration', 'error');
    }
  };

  // Remove Member Confirm
  const handleRemoveMemberConfirm = async () => {
    if (!deleteConfirm.member) return;
    try {
      setActionLoading(true);
      const m = deleteConfirm.member;
      await memberService.removeMember(m.project?._id || currentProject?._id, m._id);
      showToast('Member removed from project', 'success');
      setDeleteConfirm({ isOpen: false, member: null });
      fetchMembers();
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No limit';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Breadcrumbs matching reference */}
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
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{currentProject ? currentProject.name : 'Organization'}</span>
            <span>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>Members</span>
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Members ({totalCount})
          </h1>
        </div>

        {/* Action Buttons: Add Member & Edit Roles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hasPermission('members.add') && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setAddForm((prev) => ({
                  ...prev,
                  projectId: currentProject?._id || (projects[0] ? projects[0]._id : ''),
                }));
                setAddModalOpen(true);
              }}
              style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
              }}
            >
              Add member
            </Button>
          )}

          {hasPermission('roles.view') && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => window.location.assign('/roles')}
              style={{
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
              }}
            >
              Edit roles
            </Button>
          )}
        </div>
      </div>

      {/* Main Container Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Navigation Tabs (All, Members, Groups) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            padding: '0 24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'members', label: 'Members' },
            { id: 'groups', label: 'Groups' },
          ].map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setPage(1);
                }}
                style={{
                  padding: '16px 4px',
                  fontSize: '0.9375rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Roles filter, Sort */}
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
          {/* Left: Search input & Roles Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '260px',
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
                placeholder="Search"
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

            {/* Roles Filter Dropdown */}
            <Dropdown
              align="left"
              width="200px"
              trigger={({ isOpen }) => (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  <span>
                    {selectedRole === 'all'
                      ? 'Roles'
                      : `Role: ${selectedRole}`}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                      color: 'var(--text-muted)',
                    }}
                  />
                </button>
              )}
            >
              {({ close }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={() => {
                      setSelectedRole('all');
                      setPage(1);
                      close();
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedRole === 'all' ? 'var(--primary-light)' : 'transparent',
                      color: selectedRole === 'all' ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: selectedRole === 'all' ? 600 : 400,
                    }}
                  >
                    All Roles
                  </button>
                  {['Super Admin', 'Admin', 'Manager', 'Developer', 'Viewer'].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRole(r);
                        setPage(1);
                        close();
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedRole === r ? 'var(--primary-light)' : 'transparent',
                        color: selectedRole === r ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: selectedRole === r ? 600 : 400,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </Dropdown>
          </div>

          {/* Right: Sort dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dropdown
              align="right"
              width="180px"
              trigger={({ isOpen }) => (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  <span>
                    {sortBy === 'account'
                      ? 'Sort by account'
                      : sortBy === 'expiration'
                      ? 'Sort by expiration'
                      : 'Sort by newest'}
                  </span>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            >
              {({ close }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[
                    { id: 'account', label: 'Sort by account' },
                    { id: 'expiration', label: 'Sort by expiration' },
                    { id: 'newest', label: 'Sort by newest' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSortBy(s.id);
                        close();
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: sortBy === s.id ? 'var(--primary-light)' : 'transparent',
                        color: sortBy === s.id ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: sortBy === s.id ? 600 : 400,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </Dropdown>
          </div>
        </div>

        {/* Members Table */}
        {loading ? (
          <LoadingSpinner message="Loading members..." />
        ) : members.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No members found"
            description="No members match the current filter or search criteria."
            actionLabel={hasPermission('members.add') ? 'Add First Member' : null}
            onAction={() => setAddModalOpen(true)}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
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
                  <th style={{ padding: '16px 20px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === members.length && members.length > 0}
                      onChange={handleSelectAll}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '16px 16px' }}>Account</th>
                  <th style={{ padding: '16px 16px' }}>Projects</th>
                  <th style={{ padding: '16px 16px' }}>Access expires</th>
                  <th style={{ padding: '16px 16px' }}>Role</th>
                  <th style={{ padding: '16px 16px' }}>Expiration</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isChecked = selectedIds.includes(member._id);
                  const isExpired = member.isExpired;
                  const isExpiringSoon = member.isExpiringSoon;

                  return (
                    <tr
                      key={member._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isChecked ? 'var(--primary-light)' : 'transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '16px 20px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(member._id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>

                      {/* Account: Avatar, Name, Username */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar
                            src={member.user?.profileImage}
                            name={member.user?.name || 'User'}
                            size="md"
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {member.user?.name || 'Deleted User'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              @{member.user?.username || 'unknown'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Projects count */}
                      <td style={{ padding: '16px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {member.userProjectCount || 1}
                      </td>

                      {/* Access expires relative label */}
                      <td style={{ padding: '16px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: isExpired
                              ? '#ef4444'
                              : isExpiringSoon
                              ? '#d97706'
                              : 'var(--text-secondary)',
                          }}
                        >
                          {member.relativeExpiration}
                        </span>
                      </td>

                      {/* Role Dropdown button matching screenshot */}
                      <td style={{ padding: '16px 16px' }}>
                        <Dropdown
                          align="left"
                          width="210px"
                          trigger={({ isOpen }) => (
                            <button
                              disabled={!hasPermission('members.edit')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.8125rem',
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                                cursor: hasPermission('members.edit') ? 'pointer' : 'default',
                              }}
                            >
                              <span>{member.role?.name || 'No Role'}</span>
                              {hasPermission('members.edit') && (
                                <ChevronDown
                                  size={13}
                                  style={{
                                    transform: isOpen ? 'rotate(180deg)' : 'none',
                                    color: 'var(--text-muted)',
                                  }}
                                />
                              )}
                            </button>
                          )}
                        >
                          {({ close }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Select Project Role
                              </div>
                              {rolesList.map((r) => {
                                const isCurrent = member.role?._id === r._id;
                                return (
                                  <button
                                    key={r._id}
                                    onClick={() => {
                                      handleRoleChange(member, r._id);
                                      close();
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '8px 10px',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: isCurrent ? 'var(--primary-light)' : 'transparent',
                                      color: isCurrent ? 'var(--primary)' : 'var(--text-primary)',
                                      fontSize: '0.8125rem',
                                      textAlign: 'left',
                                      width: '100%',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        type="checkbox"
                                        readOnly
                                        checked={isCurrent}
                                        style={{ accentColor: 'var(--primary)' }}
                                      />
                                      <span>{r.name}</span>
                                    </div>
                                    {isCurrent && <Check size={14} />}
                                  </button>
                                );
                              })}
                              {hasPermission('roles.view') && (
                                <div
                                  style={{
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '4px',
                                    paddingTop: '4px',
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      close();
                                      window.location.assign('/roles');
                                    }}
                                    style={{
                                      padding: '6px 10px',
                                      fontSize: '0.75rem',
                                      color: 'var(--primary)',
                                      fontWeight: 600,
                                      width: '100%',
                                      textAlign: 'left',
                                    }}
                                  >
                                    Edit roles →
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </Dropdown>
                      </td>

                      {/* Expiration date column with calendar and clear */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontFamily: 'monospace',
                              color: isExpired ? '#ef4444' : 'var(--text-secondary)',
                            }}
                          >
                            {formatDate(member.accessExpiresAt)}
                          </span>
                          {member.accessExpiresAt && hasPermission('members.edit') && (
                            <button
                              title="Clear expiration"
                              onClick={() => handleClearExpiration(member)}
                              style={{
                                color: 'var(--text-muted)',
                                display: 'flex',
                                padding: '2px',
                              }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions: Delete */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {hasPermission('members.remove') && (
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, member })}
                            style={{
                              fontSize: '0.8125rem',
                              color: 'var(--primary)',
                              fontWeight: 500,
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination at card footer */}
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

      {/* Add Member Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Project Member"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddMember}
              loading={actionLoading}
            >
              Add Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Select Project */}
          <Select
            label="Project"
            value={addForm.projectId}
            onChange={(e) => setAddForm({ ...addForm, projectId: e.target.value })}
            options={projects.map((p) => ({ value: p._id, label: p.name }))}
            required
          />

          {/* Select User */}
          <Select
            label="User"
            value={addForm.userId}
            onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
            options={[
              { value: '', label: '-- Select a user --' },
              ...usersList.map((u) => ({
                value: u._id,
                label: `${u.name} (@${u.username}) - ${u.email}`,
              })),
            ]}
            required
          />

          {/* Select Role */}
          <Select
            label="Assigned Project Role"
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

          {/* Expiration Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Leave empty for permanent access until manually revoked.
            </span>
          </div>
        </form>
      </Modal>

      {/* Delete Member Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, member: null })}
        onConfirm={handleRemoveMemberConfirm}
        loading={actionLoading}
        title="Remove Member from Project"
        message={`Are you sure you want to remove ${
          deleteConfirm.member?.user?.name || 'this member'
        } from the project? They will lose all project access privileges.`}
        confirmText="Remove Member"
      />
    </div>
  );
};

export default Members;
