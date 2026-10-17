import api from './api';

export const roleService = {
  getRoles: () => api.get('/roles'),
  getRoleById: (id) => api.get(`/roles/${id}`),
  createRole: (roleData) => api.post('/roles', roleData),
  updateRole: (id, roleData) => api.put(`/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/roles/${id}`),
};
