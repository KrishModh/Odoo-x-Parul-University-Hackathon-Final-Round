import api from './api';

export const fetchKitchenOrders = async () => api.get('/kitchen/orders');

export const fetchKitchenMenu = async () => api.get('/kitchen/menu');

export const fetchKitchenStats = async () => api.get('/kitchen/stats');

export const updateKitchenOrderStatus = async (orderId, status) =>
  api.patch(`/kitchen/orders/${orderId}/status`, { status });
