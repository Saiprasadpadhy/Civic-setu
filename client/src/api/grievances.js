import api from './client';

export const createGrievance = async (payload) => {
  const { data } = await api.post('/grievances', payload);
  return data.data?.grievance;
};

export const getMyGrievances = async (params = {}) => {
  const { data } = await api.get('/grievances/mine', { params });
  return data.data;
};

export const getGrievanceById = async (id) => {
  const { data } = await api.get(`/grievances/${id}`);
  return data.data?.grievance;
};

export const getGrievanceTimeline = async (id) => {
  const { data } = await api.get(`/grievances/${id}/timeline`);
  return data.data?.timeline || [];
};

export const getGrievanceEvidence = async (id) => {
  const { data } = await api.get(`/grievances/${id}/evidence`);
  return data.data?.evidence || [];
};

export const closeGrievance = async (id) => {
  const { data } = await api.patch(`/grievances/${id}/close`);
  return data.data?.grievance;
};
