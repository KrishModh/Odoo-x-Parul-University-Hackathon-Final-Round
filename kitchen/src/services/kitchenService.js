import api from './api';

export const fetchKitchenOrders = async () => (await api.get('/kitchen/orders')).data;

export const updateKitchenOrderStatus = async (orderId, status) => 
  (await api.patch(`/kitchen/orders/${orderId}/status`, { status })).data;
