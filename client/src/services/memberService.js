import api from './api';

export const memberService = {
  getMembers: (params = {}) => api.get('/members', { params }),
  getProjectMembers: (projectId, params = {}) => api.get(`/projects/${projectId}/members`, { params }),
  addMember: (projectId, memberData) => api.post(`/projects/${projectId}/members`, memberData),
  updateMember: (projectId, memberId, memberData) => api.put(`/projects/${projectId}/members/${memberId}`, memberData),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
};
