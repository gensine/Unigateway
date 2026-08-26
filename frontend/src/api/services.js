import client from './client';

/*
 *
 * - This file represents the "API Layer" or "Service Layer".
 * - Separation of Concerns: Components shouldn't know HOW data is fetched (fetch vs axios).
 *   They just call `getServices()` and get data back. If we change from Axios to Fetch later, 
 *   we only update this file, not 50 different React components.
 */

/*
 *
 * - `async/await` is modern JavaScript syntax for handling Promises.
 * - It makes asynchronous code (like network requests) look and read like synchronous code.
 */

export const getServices = async (params) => {
  return await client.get('/services', { params });
};

export const createService = async (data) => {
  return await client.post('/services', data);
};

export const updateService = async (id, data) => {
  return await client.put(`/services/${id}`, data);
};

export const deleteService = async (id) => {
  return await client.delete(`/services/${id}`);
};

export const getServiceById = async (id) => {
  return await client.get(`/services/${id}`);
}
