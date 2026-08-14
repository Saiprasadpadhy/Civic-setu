import api from './client';

export const register = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};
