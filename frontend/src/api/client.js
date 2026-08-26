import axios from 'axios';

/*
 *
 * - Axios is a popular library for making HTTP requests (better than native fetch for many use cases).
 * - axios.create() creates an "instance" with default settings (like a base URL), saving us from 
 *   typing '/api' on every single request.
 */
const client = axios.create({ baseURL: '/api' });

/*Usually used to configure Axios.
 *
 * - Interceptors are like middleware for your HTTP requests.
 * - This request interceptor runs BEFORE every request leaves the browser.
 * - It's the perfect place to automatically attach an Authorization (JWT) token if the user is logged in,
 *   ensuring we never forget to send credentials.
 */
client.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
