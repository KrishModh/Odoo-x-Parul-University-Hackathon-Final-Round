import api from './api';

export const fetchAdminDashboard = async () => (await api.get('/admin/dashboard')).data;
export const fetchAdminCategories = async () => (await api.get('/admin/categories')).data.data;
export const createProduct = async (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  return (await api.post('/admin/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};
export const updateProduct = async (id, payload) => (await api.put(`/admin/products/${id}`, payload)).data;
export const archiveProduct = async (id) => (await api.delete(`/admin/products/${id}`)).data;
