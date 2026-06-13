import api from './api';

export const fetchOrderHistory = async () => (await api.get('/cashier/orders/history')).data;
export const fetchOrderStats = async () => (await api.get('/cashier/orders/stats')).data;
