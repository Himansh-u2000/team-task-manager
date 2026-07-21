import axios from 'axios';

// VITE_API_URL is optional. Leave it unset when CloudFront proxies /api/*
// to API Gateway under the same domain as the frontend (the recommended
// setup, see steps.md) — the relative '/api' path then works in both dev
// (via the Vite proxy in vite.config.js) and production (via CloudFront)
// with zero cross-origin requests. Only set VITE_API_URL if you're
// calling the API Gateway URL directly (e.g. testing before CloudFront
// is configured), in which case it must be an absolute URL and the
// backend's CLIENT_URL / CORS allow-list must match this app's origin.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Handle 401 responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const logout = () => API.post('/auth/logout');
export const getMe = () => API.get('/auth/me');
export const getAllUsers = () => API.get('/auth/users');

// ── Projects ──────────────────────────────────────
export const getProjects = () => API.get('/projects');
export const getProject = (id) => API.get(`/projects/${id}`);
export const createProject = (data) => API.post('/projects', data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const addMember = (projectId, userId) =>
  API.post(`/projects/${projectId}/members`, { userId });
export const removeMember = (projectId, userId) =>
  API.delete(`/projects/${projectId}/members/${userId}`);

// ── Tasks ─────────────────────────────────────────
export const createTask = (data) => API.post('/tasks', data);
export const getProjectTasks = (projectId) =>
  API.get(`/tasks/project/${projectId}`);
export const getMyTasks = (params) => API.get('/tasks/my-tasks', { params });
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id, status) =>
  API.put(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// ── Dashboard ─────────────────────────────────────
export const getDashboardStats = () => API.get('/dashboard/stats');
export const getProjectDashboardStats = (projectId) =>
  API.get(`/dashboard/stats/${projectId}`);

export default API;
