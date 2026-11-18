/**
 * ============================================================
 * Client API - Monitoring & Infrastructure Management
 * ============================================================
 */

import axios from 'axios';

// Appels en même origine : nginx (Docker Compose) ou l'ingress (Kubernetes)
// relaient /api vers le backend, et Vite fait de même en développement.
// Aucune URL de backend n'est donc figée dans le bundle.
const TOKEN_KEY = 'devsecops.token';
const USER_KEY = 'devsecops.user';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Session (jeton JWT conservé le temps de l'onglet) ───────────────────────
export const getToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const getCurrentUser = () => {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
};

const saveSession = (token, user) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* stockage indisponible : session limitée à la page */ }
};

export const logout = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch { /* rien à nettoyer */ }
  window.dispatchEvent(new Event('auth:logout'));
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Jeton expiré ou révoqué : retour à l'écran de connexion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url === '/api/auth/login';
    if (error.response?.status === 401 && !isLogin && getToken()) logout();
    return Promise.reject(error);
  },
);

export const login = async (username, password) => {
  const response = await api.post('/api/auth/login', { username, password });
  saveSession(response.data.token, response.data.user);
  return response.data.user;
};

// État réel du pipeline, lu dans Jenkins par le backend
export const getPipeline = async () => {
  const response = await api.get('/api/cicd/pipeline');
  return response.data;
};

export const deployServer = async (name, location) => {
  const response = await api.post('/api/servers/auto-deploy', { name, location });
  return response.data;
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
};

export const getMonitoringOverview = async () => {
  try {
    const response = await api.get('/api/monitoring/overview');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch monitoring overview:', error.message);
    throw error;
  }
};

export const getMonitoringHistory = async (minutes = 30) => {
  try {
    const response = await api.get(`/api/monitoring/history?minutes=${minutes}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch monitoring history:', error.message);
    throw error;
  }
};

export const getDashboard = async () => {
  try {
    const response = await api.get('/api/dashboard');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch dashboard:', error.message);
    throw error;
  }
};

export const getServers = async () => {
  try {
    const response = await api.get('/api/servers');
    return response.data.servers;
  } catch (error) {
    console.error('❌ Failed to fetch servers:', error.message);
    throw error;
  }
};

export const createServer = async (serverData) => {
  try {
    const response = await api.post('/api/servers', serverData);
    return response.data.server;
  } catch (error) {
    console.error('❌ Failed to create server:', error.message);
    throw error;
  }
};

export const deleteServer = async (serverId) => {
  try {
    const response = await api.delete(`/api/servers/${serverId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to delete server ${serverId}:`, error.message);
    throw error;
  }
};

export const runServerHealthCheck = async (serverId) => {
  try {
    const response = await api.post(`/api/servers/${serverId}/healthcheck`);
    return response.data.server;
  } catch (error) {
    console.error(`❌ Failed to run health check on server ${serverId}:`, error.message);
    throw error;
  }
};

export const simulateServerFailure = async (serverId) => {
  try {
    const response = await api.post(`/api/servers/${serverId}/simulate-failure`);
    return response.data.server;
  } catch (error) {
    console.error(`❌ Failed to simulate failure on server ${serverId}:`, error.message);
    throw error;
  }
};

export const getAlerts = async () => {
  try {
    const response = await api.get('/api/alerts');
    return response.data.alerts;
  } catch (error) {
    console.error('❌ Failed to fetch alerts:', error.message);
    throw error;
  }
};

export const getServices = async () => {
  try {
    const response = await api.get('/api/services');
    return response.data.services;
  } catch (error) {
    console.error('❌ Failed to fetch services:', error.message);
    throw error;
  }
};

export const updateAlert = async (alertId, updateData) => {
  try {
    const response = await api.put(`/api/alerts/${alertId}`, updateData);
    return response.data.alert;
  } catch (error) {
    console.error(`❌ Failed to update alert ${alertId}:`, error.message);
    throw error;
  }
};

export default {
  login,
  logout,
  deployServer,
  getPipeline,
  checkHealth,
  getMonitoringOverview,
  getMonitoringHistory,
  getDashboard,
  getServers,
  createServer,
  deleteServer,
  runServerHealthCheck,
  simulateServerFailure,
  getServices,
  getAlerts,
  updateAlert,
};
