import request from 'supertest';
import app from '../../app';
import { connectTestDB, disconnectTestDB, clearTestDB, initTestData, createTestUser } from '../setup';

const expectApiEnvelope = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      success: expect.any(Boolean),
      message: expect.any(String),
      data: expect.anything(),
      errors: null,
    })
  );
  expect(body).toHaveProperty('meta');
};

describe('API response contract', () => {
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

  it('keeps auth login response compatible with the frontend auth contract', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expectApiEnvelope(res.body);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' }),
        accessToken: expect.any(String),
      })
    );
  });

  it('keeps notifications response compatible with the frontend pagination normalizer', async () => {
    await createTestUser();
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);

    expect(res.status).toBe(200);
    expectApiEnvelope(res.body);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        totalPages: expect.any(Number),
      })
    );
  });
});
