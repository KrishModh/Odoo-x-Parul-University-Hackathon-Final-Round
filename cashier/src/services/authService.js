import api from './api';

export const loginUser = async (credentials) => (await api.post('/auth/login', credentials)).data;
export const signupUser = async (details) => (await api.post('/auth/signup', details)).data;
export const verifyOtp = async (payload) => (await api.post('/auth/verify-otp', payload)).data;
export const resendOtp = async (payload) => (await api.post('/auth/resend-otp', payload)).data;
export const fetchCurrentUser = async () => (await api.get('/auth/me')).data;
