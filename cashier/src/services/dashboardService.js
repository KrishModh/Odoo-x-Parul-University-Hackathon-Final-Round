import api from './api';

export const fetchDashboard = async () => (await api.get('/cashier/dashboard')).data;
