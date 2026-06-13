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

export const fetchCoupons = async () => (await api.get('/coupons')).data;
export const createCoupon = async (payload) => (await api.post('/coupons/create', payload)).data;
export const deleteCoupon = async (id) => (await api.delete(`/coupons/${id}`)).data;
export const updateCouponStatus = async (id, is_active) => (await api.patch(`/coupons/${id}/status`, { is_active })).data;
