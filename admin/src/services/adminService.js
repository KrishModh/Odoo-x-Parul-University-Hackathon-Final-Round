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
export const updateProduct = async (id, payload) => {
  if (payload?.image) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    return (await api.patch(`/admin/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  }
  return (await api.patch(`/admin/products/${id}`, payload)).data;
};
export const updateProductStock = async (id, payload) => (await api.patch(`/admin/products/${id}/stock`, payload)).data;
export const archiveProduct = async (id, is_active = false) => (await api.patch(`/admin/products/${id}`, { is_active })).data;
export const deleteProduct = async (id) => (await api.delete(`/admin/products/${id}`)).data;

export const fetchAdminTables = async () => (await api.get('/admin/tables')).data;
export const createTable = async (payload) => (await api.post('/admin/tables', payload)).data;
export const updateTable = async (id, payload) => (await api.patch(`/admin/tables/${id}`, payload)).data;
export const deleteTable = async (id) => (await api.delete(`/admin/tables/${id}`)).data;

export const fetchCoupons = async () => (await api.get('/coupons')).data;
export const createCoupon = async (payload) => (await api.post('/coupons/create', payload)).data;
export const deleteCoupon = async (id) => (await api.delete(`/coupons/${id}`)).data;
export const updateCouponStatus = async (id, is_active) => (await api.patch(`/coupons/${id}/status`, { is_active })).data;

export const fetchEmployeeRequests = async () => (await api.get('/admin/employee-requests')).data;
export const approveEmployee = async (id) => (await api.patch(`/admin/employee-requests/${id}/approve`)).data;
export const rejectEmployee = async (id, payload) => (await api.patch(`/admin/employee-requests/${id}/reject`, payload)).data;

export const removeEmployee = async (id) => (await api.patch(`/admin/employees/${id}/remove`)).data;
export const restoreEmployee = async (id) => (await api.patch(`/admin/employees/${id}/restore`)).data;

export const fetchCustomers = async (params = {}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.filter) qs.set('filter', params.filter);
  return (await api.get(`/admin/customers?${qs.toString()}`)).data;
};

export const fetchCustomerOrders = async (email) =>
  (await api.get(`/admin/customers/orders?email=${encodeURIComponent(email)}`)).data;
