import api from './client';

export const previewAiAnalysis = async (payload) => {
  const { data } = await api.post('/ai/preview', payload);
  return data.data;
};

export const getGrievanceAiAnalysis = async (id) => {
  const { data } = await api.get(`/ai/grievances/${id}/ai`);
  return data.data;
};

export const retryGrievanceAiAnalysis = async (id) => {
  const { data } = await api.post(`/ai/grievances/${id}/ai/retry`);
  return data.data;
};

export const getGrievanceDuplicates = async (id) => {
  const { data } = await api.get(`/ai/grievances/${id}/duplicates`);
  return data.data;
};
