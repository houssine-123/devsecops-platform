/**
 * ============================================================
 * Client API - Monitoring & Infrastructure Management
 * ============================================================
 */

import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🔗 Backend URL:', BACKEND_URL);

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const getServices = async () => {
  try {
    const response = await api.get('/api/services');
    return response.data.services;
  } catch (error) {
    console.error('❌ Failed to fetch services:', error.message);
    throw error;
  }
};

export const createService = async (serviceData) => {
  try {
    const response = await api.post('/api/services', serviceData);
    return response.data.service;
  } catch (error) {
    console.error('❌ Failed to create service:', error.message);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    const response = await api.delete(`/api/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to delete service ${serviceId}:`, error.message);
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
  createService,
  deleteService,
  getAlerts,
  updateAlert,
};
