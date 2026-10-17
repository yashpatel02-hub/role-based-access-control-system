import api from './api';

export const permissionService = {
  getPermissions: () => api.get('/permissions'),
  createPermission: (permData) => api.post('/permissions', permData),
  updatePermission: (id, permData) => api.put(`/permissions/${id}`, permData),
  deletePermission: (id) => api.delete(`/permissions/${id}`),
};
