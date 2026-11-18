// Tests de l'authentification JWT et du contrôle d'accès de l'API
jest.mock('../db', () => ({
  initDatabase: jest.fn().mockResolvedValue(true),
  getServers: jest.fn().mockResolvedValue([]),
  getAlerts: jest.fn().mockResolvedValue([]),
  getDashboardStats: jest.fn().mockResolvedValue({
    servers: 0, services: 0, alerts: 0,
    serverStatus: { online: 0, degraded: 0, offline: 0 },
    alertStatus: { new: 0, acknowledged: 0, resolved: 0 },
  }),
}));

process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'test-password';
process.env.JWT_SECRET = 'test-jwt-secret';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../server');

const login = (body) => request(app).post('/api/auth/login').send(body);

describe('POST /api/auth/login', () => {
  test('returns a JWT for valid credentials', async () => {
    const res = await login({ username: 'admin', password: 'test-password' });
    expect(res.statusCode).toBe(200);
    expect(res.body.tokenType).toBe('Bearer');
    const payload = jwt.verify(res.body.token, 'test-jwt-secret');
    expect(payload.sub).toBe('admin');
  });

  test('rejects a wrong password', async () => {
    const res = await login({ username: 'admin', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body).not.toHaveProperty('token');
  });

  test('rejects an unknown user', async () => {
    const res = await login({ username: 'root', password: 'test-password' });
    expect(res.statusCode).toBe(401);
  });

  test('rejects a malformed body', async () => {
    const res = await login({ username: ['admin'], password: { $ne: '' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('Protected routes', () => {
  test('reject requests without a token', async () => {
    const res = await request(app).get('/api/alerts');
    expect(res.statusCode).toBe(401);
  });

  test('reject a token signed with another secret', async () => {
    const forged = jwt.sign({ sub: 'admin', role: 'admin' }, 'attacker-secret', { issuer: 'devsecops-platform' });
    const res = await request(app).get('/api/alerts').set('Authorization', `Bearer ${forged}`);
    expect(res.statusCode).toBe(401);
  });

  test('reject an expired token', async () => {
    const expired = jwt.sign({ sub: 'admin', role: 'admin' }, 'test-jwt-secret', { issuer: 'devsecops-platform', expiresIn: -10 });
    const res = await request(app).get('/api/alerts').set('Authorization', `Bearer ${expired}`);
    expect(res.statusCode).toBe(401);
  });

  test('reject the "none" algorithm', async () => {
    const unsigned = jwt.sign({ sub: 'admin', role: 'admin' }, null, { algorithm: 'none', issuer: 'devsecops-platform' });
    const res = await request(app).get('/api/alerts').set('Authorization', `Bearer ${unsigned}`);
    expect(res.statusCode).toBe(401);
  });

  test('accept a valid token', async () => {
    const { body } = await login({ username: 'admin', password: 'test-password' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.username).toBe('admin');
  });
});

describe('Public routes and hardening', () => {
  test('health and metrics stay public for probes and Prometheus', async () => {
    expect((await request(app).get('/api/health')).statusCode).toBe(200);
    expect((await request(app).get('/api/metrics')).statusCode).toBe(200);
  });

  test('security headers are set and the stack is hidden', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('cross-origin requests are not allowed by default', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(res.headers).not.toHaveProperty('access-control-allow-origin');
  });

  test('a malformed JSON body returns 400 without internal details', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username": ');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid request body' });
  });

  test('login is rate limited against brute force', async () => {
    let last;
    for (let i = 0; i < 12; i++) {
      last = await login({ username: 'admin', password: `guess-${i}` });
    }
    expect(last.statusCode).toBe(429);
  });
});
