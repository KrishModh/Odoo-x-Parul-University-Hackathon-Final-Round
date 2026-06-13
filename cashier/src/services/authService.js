import api from './api';

export const loginUser = async (credentials) => (await api.post('/auth/login', credentials)).data;
export const signupUser = async (details) => (await api.post('/auth/signup', details)).data;
export const fetchCurrentUser = async () => (await api.get('/auth/me')).data;
