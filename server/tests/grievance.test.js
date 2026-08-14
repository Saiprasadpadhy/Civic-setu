import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import Ward from '../src/models/Ward.js';
import { hashPassword } from '../src/utils/bcrypt.js';

let wardId;
let departmentId;
let citizenToken;
let officerToken;
let adminToken;
let officerId;
let grievanceId;

async function login(email, password) {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  return response.body.data.token;
}

async function seedUsersAndReferenceData() {
  const department = await Department.create({
    code: 'TEST-SAN',
    name: 'Test Sanitation',
    categories: ['garbage'],
    defaultSlaHours: 72,
    contactEmail: 'san@test.com',
  });
  departmentId = department._id.toString();

  const ward = await Ward.create({
    code: 'TEST-W1',
    name: 'Test Ward 1',
    city: 'Test City',
    center: { type: 'Point', coordinates: [85.82, 20.29] },
  });
  wardId = ward._id.toString();

  const citizenPassword = await hashPassword('password123');
  await User.create({
    name: 'Grievance Citizen',
    email: 'grievance.citizen@example.com',
    passwordHash: citizenPassword,
    role: 'citizen',
  });

  const officerPassword = await hashPassword('password123');
  const officer = await User.create({
    name: 'Grievance Officer',
    email: 'grievance.officer@example.com',
    passwordHash: officerPassword,
    role: 'officer',
    departmentId: department._id,
  });
  officerId = officer._id.toString();

  const adminPassword = await hashPassword('password123');
  await User.create({
    name: 'Grievance Admin',
    email: 'grievance.admin@example.com',
    passwordHash: adminPassword,
    role: 'admin',
  });

  citizenToken = await login('grievance.citizen@example.com', 'password123');
  officerToken = await login('grievance.officer@example.com', 'password123');
  adminToken = await login('grievance.admin@example.com', 'password123');
}

describe('Grievance API', () => {
  beforeEach(async () => {
    await seedUsersAndReferenceData();
  });

  it('creates a grievance as citizen', async () => {
    const response = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Garbage overflow',
        description: 'Uncollected garbage near the main road for three days.',
        category: 'garbage',
        wardId,
        latitude: 20.29,
        longitude: 85.82,
        location: 'Main Road Junction',
        images: [{ url: 'https://example.com/image.jpg', mimeType: 'image/jpeg' }],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.grievance.status).toBe('submitted');
    expect(response.body.data.grievance.ticketId).toBeTruthy();
    grievanceId = response.body.data.grievance._id;
  });

  it('prevents citizen from accessing another citizen grievance', async () => {
    const createResponse = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Garbage overflow',
        description: 'Uncollected garbage near the main road for three days.',
        category: 'garbage',
        wardId,
        latitude: 20.29,
        longitude: 85.82,
        location: 'Main Road Junction',
      });
    grievanceId = createResponse.body.data.grievance._id;

    const otherPassword = await hashPassword('password123');
    await User.create({
      name: 'Other Citizen',
      email: 'other.citizen@example.com',
      passwordHash: otherPassword,
      role: 'citizen',
    });
    const otherToken = await login('other.citizen@example.com', 'password123');

    const response = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(403);
  });

  it('lists citizen grievances', async () => {
    await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Garbage overflow',
        description: 'Uncollected garbage near the main road for three days.',
        category: 'garbage',
        wardId,
        latitude: 20.29,
        longitude: 85.82,
        location: 'Main Road Junction',
      });

    const response = await request(app)
      .get('/api/grievances/mine')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThan(0);
  });

  it('runs full officer and admin workflow', async () => {
    const createResponse = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Garbage overflow',
        description: 'Uncollected garbage near the main road for three days.',
        category: 'garbage',
        wardId,
        latitude: 20.29,
        longitude: 85.82,
        location: 'Main Road Junction',
      });
    grievanceId = createResponse.body.data.grievance._id;

    const assignResponse = await request(app)
      .patch(`/api/admin/grievances/${grievanceId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ officerId });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body.data.grievance.status).toBe('assigned');

    const statusResponse = await request(app)
      .patch(`/api/officer/grievances/${grievanceId}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'in_progress', note: 'Work started on site' });

    expect(statusResponse.status).toBe(200);

    const remarkResponse = await request(app)
      .post(`/api/officer/grievances/${grievanceId}/remarks`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ note: 'Team deployed to location' });

    expect(remarkResponse.status).toBe(200);

    const resolveResponse = await request(app)
      .post(`/api/officer/grievances/${grievanceId}/resolve`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ resolutionSummary: 'Garbage cleared and area sanitized.' });

    expect(resolveResponse.status).toBe(200);
    expect(resolveResponse.body.data.grievance.status).toBe('resolved');

    const evidenceResponse = await request(app)
      .post(`/api/officer/grievances/${grievanceId}/evidence`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        url: 'https://example.com/after.jpg',
        mimeType: 'image/jpeg',
        evidenceType: 'after',
        caption: 'Area after cleanup',
      });

    expect(evidenceResponse.status).toBe(201);

    const timelineResponse = await request(app)
      .get(`/api/grievances/${grievanceId}/timeline`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(timelineResponse.status).toBe(200);
    expect(timelineResponse.body.data.timeline.length).toBeGreaterThan(1);

    const evidenceListResponse = await request(app)
      .get(`/api/grievances/${grievanceId}/evidence`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(evidenceListResponse.status).toBe(200);
    expect(evidenceListResponse.body.data.evidence.length).toBe(1);

    const auditResponse = await request(app)
      .get(`/api/admin/grievances/${grievanceId}/audit`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.data.auditLogs.length).toBeGreaterThan(0);

    const invalidTransition = await request(app)
      .patch(`/api/officer/grievances/${grievanceId}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'submitted' });

    expect(invalidTransition.status).toBe(400);
  });
});
