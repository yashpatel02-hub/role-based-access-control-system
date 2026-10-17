import api from './api';

export const userService = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  changeStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  updateRoles: (id, roles) => api.patch(`/users/${id}/roles`, { roles }),
};
