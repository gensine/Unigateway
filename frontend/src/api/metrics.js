import client from './client';

export const getMetricsSummary = (params) => client.get('/metrics/summary', { params });
export const getServiceMetrics = (id, params) => client.get(`/metrics/${id}`, { params });
export const getServicePercentiles = (id) => client.get(`/metrics/${id}/percentiles`);
