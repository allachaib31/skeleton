import request from 'supertest';
import app from '../../app';
import { connectTestDB, disconnectTestDB, clearTestDB, initTestData, createTestUser } from '../setup';
import { User } from '../../modules/users/user.model';
import { Role } from '../../modules/roles/role.model';
import { RefreshToken } from '../../modules/auth/refresh-token.model';
import { hashToken } from '../../modules/auth/token.service';

const login = async (email = 'test@example.com', password = 'Password123!') =>
  request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

describe('Auth Integration Tests', () => {
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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 when default user role is missing', async () => {
      await Role.deleteOne({ name: 'USER' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'missing-role@example.com',
          password: 'Password123!',
          name: 'Missing Role'
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // First register
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User'
        });

      // Then verify email manually (mocking verification)
      await User.updateOne({ email: 'test@example.com' }, { isEmailVerified: true });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject banned users', async () => {
      await createTestUser('USER', { status: 'banned' });

      const res = await login();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh access tokens and rotate refresh cookies', async () => {
      await createTestUser();
      const loginRes = await login();

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', loginRes.headers['set-cookie']);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject expired refresh tokens', async () => {
      await createTestUser();
      const loginRes = await login();

      await RefreshToken.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', loginRes.headers['set-cookie']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout an authenticated user', async () => {
      await createTestUser();
      const loginRes = await login();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
        .set('Cookie', loginRes.headers['set-cookie']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset a password with a valid token', async () => {
      const rawToken = 'reset-token';
      await createTestUser();
      await User.updateOne(
        { email: 'test@example.com' },
        {
          passwordResetToken: hashToken(rawToken),
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        }
      );

      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, password: 'NewPassword123!' });

      expect(resetRes.status).toBe(200);

      const loginRes = await login('test@example.com', 'NewPassword123!');
      expect(loginRes.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/users/me', () => {
    it('should soft delete the authenticated account', async () => {
      await createTestUser();
      const loginRes = await login();

      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
        .send({ password: 'Password123!' });

      expect(res.status).toBe(200);

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user?.status).toBe('inactive');
    });
  });

  describe('authenticated routes', () => {
    it('should reject invalid access tokens', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
