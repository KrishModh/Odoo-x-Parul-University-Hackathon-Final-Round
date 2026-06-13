import api from './api';

export const loginUser = async (credentials) => (await api.post('/kitchen/auth/login', credentials)).data;
export const signupUser = async (details) => (await api.post('/kitchen/auth/signup', details)).data;
export const verifyOtp = async (payload) => (await api.post('/kitchen/auth/verify-otp', payload)).data;
export const resendOtp = async (payload) => (await api.post('/kitchen/auth/resend-otp', payload)).data;
export const fetchCurrentUser = async () => (await api.get('/kitchen/auth/me')).data;

export const fetchProfile = async () => (await api.get('/auth/profile')).data;
export const updateProfile = async (data) => (await api.patch('/auth/profile', data)).data;
export const updatePassword = async (data) => (await api.patch('/auth/profile/password', data)).data;

export const forgotPassword = async (data) => (await api.post('/auth/forgot-password', data)).data;
export const verifyResetOtp = async (data) => (await api.post('/auth/verify-reset-otp', data)).data;
export const resetPassword = async (data) => (await api.post('/auth/reset-password', data)).data;
