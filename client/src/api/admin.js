import api from './client';

export const getAdminGrievances = async (params = {}) => {
  const { data } = await api.get('/admin/grievances', { params });
  return data.data;
};

export const getAdminGrievanceById = async (id) => {
  const { data } = await api.get(`/admin/grievances/${id}`);
  return data.data?.grievance;
};

export const getAdminTimeline = async (id) => {
  const { data } = await api.get(`/admin/grievances/${id}/timeline`);
  return data.data?.timeline || [];
};

export const getAdminAuditLogs = async (id) => {
  const { data } = await api.get(`/admin/grievances/${id}/audit`);
  return data.data?.auditLogs || [];
};

export const assignGrievanceOfficer = async (id, officerId) => {
  const { data } = await api.patch(`/admin/grievances/${id}/assign`, { officerId });
  return data.data?.grievance;
};

export const overrideAdminGrievanceStatus = async (id, { status, note }) => {
  const { data } = await api.patch(`/admin/grievances/${id}/status`, { status, note });
  return data.data?.grievance;
};

export const getAdminOfficers = async (departmentId) => {
  const { data } = await api.get('/admin/officers', { params: { departmentId } });
  return data.data?.officers || [];
};
