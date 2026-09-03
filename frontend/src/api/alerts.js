import client from './client';

export const getAlertRules = async (params) => {
  return await client.get('/alerts/rules', { params });
};

export const createAlertRule = async (data) => {
  return await client.post('/alerts/rules', data);
};

export const updateAlertRule = async (id, data) => {
  return await client.put(`/alerts/rules/${id}`, data);
};

export const deleteAlertRule = async (id) => {
  return await client.delete(`/alerts/rules/${id}`);
};

export const getAlertEvents = async (params) => {
  return await client.get('/alerts/events', { params });
};
