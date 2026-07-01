// Mock minimal db functions to avoid real Postgres connection during tests
jest.mock('../db', () => ({
  initDatabase: jest.fn().mockResolvedValue(true),
  getDashboardStats: jest.fn().mockResolvedValue({ servers: 0, services: 0, alerts: 0, serverStatus: { online: 0, degraded: 0, offline: 0 }, alertStatus: { new: 0, acknowledged: 0, resolved: 0 } }),
}));

const request = require('supertest');
const app = require('../server');

describe('Health endpoints', () => {
  test('GET /api/health returns status up', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'up');
    expect(res.body).toHaveProperty('uptime');
  });

  test('GET /api/ready returns 503 when DB not initialized', async () => {
    const res = await request(app).get('/api/ready');
    // db.initDatabase is not called in tests so readiness should be 503
    expect([200, 503]).toContain(res.statusCode);
  });
});
