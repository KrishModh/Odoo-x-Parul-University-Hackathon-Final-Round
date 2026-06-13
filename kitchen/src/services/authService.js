import api from './api';

export const loginUser = async (credentials) => (await api.post('/kitchen/auth/login', credentials)).data;
export const signupUser = async (details) => (await api.post('/kitchen/auth/signup', details)).data;
export const verifyOtp = async (payload) => (await api.post('/kitchen/auth/verify-otp', payload)).data;
export const resendOtp = async (payload) => (await api.post('/kitchen/auth/resend-otp', payload)).data;
export const fetchCurrentUser = async () => (await api.get('/kitchen/auth/me')).data;
