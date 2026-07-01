// Mock the db module used by the server (must be before requiring server)
jest.mock('../db', () => {
  const servers = [];
  return {
    initDatabase: jest.fn().mockResolvedValue(true),
    getDashboardStats: jest.fn().mockResolvedValue({ servers: 0, services: 0, alerts: 0, serverStatus: { online: 0, degraded: 0, offline: 0 }, alertStatus: { new: 0, acknowledged: 0, resolved: 0 } }),
    getServers: jest.fn().mockResolvedValue(servers),
    getServerById: jest.fn().mockImplementation((id) => Promise.resolve(null)),
    createServer: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'test-id', ...data })),
    updateServer: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
    deleteServer: jest.fn().mockImplementation((id) => Promise.resolve({ id })),
    updateServerHealth: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
  };
});

const request = require('supertest');
const app = require('../server');

describe('Servers API', () => {
  test('GET /api/servers returns list', async () => {
    const res = await request(app).get('/api/servers');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('servers');
    expect(Array.isArray(res.body.servers)).toBe(true);
  });

  test('POST /api/servers validates input', async () => {
    const res = await request(app).post('/api/servers').send({ name: 'a' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/servers creates server with valid data', async () => {
    const payload = { name: 'srv1', ip: '10.0.0.1', location: 'datacenter-1' };
    const res = await request(app).post('/api/servers').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('server');
    expect(res.body.server).toMatchObject(payload);
  });
});
