import api from './api';

export const fetchOrderHistory = async () => (await api.get('/cashier/orders/history')).data;
export const fetchOrderStats = async () => (await api.get('/cashier/orders/stats')).data;
export const cancelOrder = async (orderId) => (await api.patch(`/orders/${orderId}/cancel`)).data;
