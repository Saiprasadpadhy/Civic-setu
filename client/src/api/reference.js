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

export const getCategories = async () => {
  const departments = await getDepartments();
  const catSet = new Set();
  departments.forEach((d) => {
    (d.categories || []).forEach((c) => catSet.add(c));
  });
  if (catSet.size === 0) {
    return ['pothole', 'garbage', 'streetlight', 'water', 'drainage', 'sanitation', 'roads'];
  }
  return Array.from(catSet);
};
