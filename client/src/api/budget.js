import api from './client';

export const getBudgetProjects = async (params = {}) => {
  const { data } = await api.get('/budget-projects', { params });
  return data.data?.projects || [];
};

export const voteOnBudgetProject = async (id) => {
  const { data } = await api.post(`/budget-projects/${id}/vote`);
  return data.data;
};

export const createBudgetProject = async (payload) => {
  const { data } = await api.post('/budget-projects', payload);
  return data.data?.project;
};

export const simulateBudget = async (payload) => {
  const { data } = await api.post('/budget-projects/simulate', payload);
  return data.data;
};

export const updateBudgetProjectStatus = async (id, payload) => {
  const { data } = await api.patch(`/budget-projects/${id}/status`, payload);
  return data.data?.project;
};

export const getBudgetAnalytics = async () => {
  const { data } = await api.get('/budget-projects/analytics');
  return data.data;
};
