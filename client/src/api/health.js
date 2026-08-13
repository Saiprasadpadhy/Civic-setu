import api from './client';

export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}
