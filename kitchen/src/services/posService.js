import api from './api';

export const fetchPosBootstrap = async () => {
  const [tables, categories, products] = await Promise.all([
    api.get('/pos/tables'),
    api.get('/pos/categories'),
    api.get('/pos/products'),
  ]);

  return {
    tables: tables.data.data,
    categories: categories.data.data,
    products: products.data.data,
  };
};

export const createOrder = async (payload) => (await api.post('/pos/orders', payload)).data;
