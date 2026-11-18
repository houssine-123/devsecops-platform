// Tests de l'onglet CI/CD : lecture de l'état réel du pipeline dans Jenkins
jest.mock('../db', () => ({
  initDatabase: jest.fn().mockResolvedValue(true),
}));

process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'test-password';
process.env.JWT_SECRET = 'test-jwt-secret';

const request = require('supertest');
const app = require('../server');
const { normalizeStages } = require('../jenkins');

const jenkinsRuns = [
  {
    id: '30',
    name: '#30',
    status: 'FAILED',
    startTimeMillis: 1794950898741,
    durationMillis: 646536,
    stages: [
      { name: 'Declarative: Checkout SCM', status: 'SUCCESS', durationMillis: 1247 },
      { name: 'Build Backend', status: 'SUCCESS', durationMillis: 22021 },
      { name: 'Trivy - Image Scan', status: 'FAILED', durationMillis: 16000 },
      { name: 'Docker Push', status: 'FAILED', durationMillis: 0 },
      { name: 'Deploy', status: 'FAILED', durationMillis: 0 },
    ],
  },
];

describe('normalizeStages', () => {
  test('hides Declarative stages and marks stages skipped after a failure', () => {
    const stages = normalizeStages(jenkinsRuns[0].stages);
    expect(stages.map((s) => s.name)).toEqual(['Build Backend', 'Trivy - Image Scan', 'Docker Push', 'Deploy']);
    expect(stages.map((s) => s.status)).toEqual(['SUCCESS', 'FAILED', 'SKIPPED', 'SKIPPED']);
  });
});

describe('GET /api/cicd/pipeline', () => {
  let authHeader;
  const realFetch = global.fetch;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'test-password' });
    authHeader = `Bearer ${res.body.token}`;
  });

  afterEach(() => { global.fetch = realFetch; });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/cicd/pipeline');
    expect(res.statusCode).toBe(401);
  });

  test('returns the runs read from Jenkins', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => jenkinsRuns });
    const res = await request(app).get('/api/cicd/pipeline').set('Authorization', authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.body.runs[0]).toMatchObject({ id: 30, status: 'FAILED' });
    expect(res.body.runs[0].stages[1]).toMatchObject({ name: 'Trivy - Image Scan', status: 'FAILED' });
  });
});
