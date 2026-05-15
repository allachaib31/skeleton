import request from 'supertest';
import app from '../../app';
import { connectTestDB, disconnectTestDB, clearTestDB, initTestData, createTestUser } from '../setup';

const loginAs = async (role: 'USER' | 'ADMIN' | 'SUPER_ADMIN', email: string) => {
  await createTestUser(role, { email });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'Password123!' });

  return res.body.data.accessToken as string;
};

describe('Authorization Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
    await initTestData();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    await initTestData();
  });

  it('rejects unauthenticated notification access', async () => {
    const res = await request(app).get('/api/v1/notifications/unread-count');

    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated upload access', async () => {
    const res = await request(app).get('/api/v1/uploads');

    expect(res.status).toBe(401);
  });

  it('rejects normal users from admin routes', async () => {
    const token = await loginAs('USER', 'user@example.com');

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows admins to access admin routes', async () => {
    const token = await loginAs('ADMIN', 'admin@example.com');

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('protects admin language management from normal users', async () => {
    const token = await loginAs('USER', 'language-user@example.com');

    const res = await request(app)
      .get('/api/v1/admin/languages')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
