import api from './api';

export const createPaymentOrder = async (payload) => (await api.post('/payments/create-order', payload)).data;
export const verifyPayment = async (payload) => (await api.post('/payments/verify', payload)).data;
export const processCashPayment = async (payload) => (await api.post('/payments/charge-cash', payload)).data;
export const applyCouponCode = async (payload) => (await api.post('/coupons/apply', payload)).data;
