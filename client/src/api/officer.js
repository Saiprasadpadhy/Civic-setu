import api from './client';

export const getOfficerGrievances = async (params = {}) => {
  const { data } = await api.get('/officer/grievances', { params });
  return data.data;
};

export const getOfficerGrievanceById = async (id) => {
  const { data } = await api.get(`/officer/grievances/${id}`);
  return data.data?.grievance;
};

export const updateOfficerGrievanceStatus = async (id, { status, note }) => {
  const { data } = await api.patch(`/officer/grievances/${id}/status`, { status, note });
  return data.data?.grievance;
};

export const addOfficerRemark = async (id, note) => {
  const { data } = await api.post(`/officer/grievances/${id}/remarks`, { note });
  return data.data;
};

export const resolveOfficerGrievance = async (id, resolutionSummary) => {
  const { data } = await api.post(`/officer/grievances/${id}/resolve`, { resolutionSummary });
  return data.data?.grievance;
};

export const uploadOfficerResolutionEvidence = async (id, payload) => {
  const { data } = await api.post(`/officer/grievances/${id}/evidence`, payload);
  return data.data?.evidence;
};
