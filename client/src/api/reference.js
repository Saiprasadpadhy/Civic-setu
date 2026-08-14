import api from './client';

export const getDepartments = async () => {
  const { data } = await api.get('/departments');
  return data.data?.departments || [];
};

export const getWards = async () => {
  const { data } = await api.get('/wards');
  return data.data?.wards || [];
};

export const getWardById = async (id) => {
  const { data } = await api.get(`/wards/${id}`);
  return data.data?.ward;
};
