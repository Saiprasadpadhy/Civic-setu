import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/bcrypt.js';

const validUser = {
  name: 'Test Citizen',
  email: 'citizen@example.com',
  password: 'password123',
};

async function createAdminUser() {
  const passwordHash = await hashPassword('adminpass123');
  return User.create({
    name: 'Test Admin',
    email: 'admin@example.com',
    passwordHash,
    role: 'admin',
  });
}

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a citizen successfully', async () => {
      const response = await request(app).post('/api/auth/register').send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.user.role).toBe('citizen');
      expect(response.body.data.token).toBeTruthy();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects duplicate registration', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app).post('/api/auth/register').send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/email already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeTruthy();
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects incorrect password', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid or expired token/i);
    });

    it('allows access to protected route with valid token', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send(validUser);
      const token = registerResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
    });

    it('rejects protected route without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('Role-based authorization', () => {
    it('restricts admin-only route for citizens', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send(validUser);
      const citizenToken = registerResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/permission/i);
    });

    it('allows admin-only route for admin users', async () => {
      await createAdminUser();

      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'adminpass123',
      });

      const adminToken = loginResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });
  });
});
