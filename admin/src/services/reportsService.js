import api from './api';

export const fetchReportsSummary = async (params) => {
  const response = await api.get('/reports/summary', { params });
  return response.data;
};

export const fetchReportsRevenue = async (params) => {
  const response = await api.get('/reports/revenue', { params });
  return response.data;
};

export const fetchReportsProducts = async (params) => {
  const response = await api.get('/reports/products', { params });
  return response.data;
};

export const fetchReportsCustomers = async (params) => {
  const response = await api.get('/reports/customers', { params });
  return response.data;
};

export const fetchReportsPayments = async (params) => {
  const response = await api.get('/reports/payments', { params });
  return response.data;
};

export const exportReportsCsv = async (params) => {
  const response = await api.get('/reports/export/csv', { params, responseType: 'blob' });
  return response.data;
};

export const exportReportsPdf = async (params) => {
  const response = await api.get('/reports/export/pdf', { params, responseType: 'blob' });
  return response.data;
};
