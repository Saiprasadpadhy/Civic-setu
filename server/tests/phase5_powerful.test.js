import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import Ward from '../src/models/Ward.js';
import Grievance from '../src/models/Grievance.js';
import { hashPassword } from '../src/utils/bcrypt.js';
import { runIntelligencePipeline } from '../src/services/aiIntelligence.service.js';

async function setupPhase5Environment() {
  const department = await Department.create({
    code: 'ROADS',
    name: 'Public Works Department',
    categories: ['pothole', 'roads', 'streetlight', 'garbage'],
    defaultSlaHours: 48,
    contactEmail: 'publicworks@test.com',
  });

  const ward = await Ward.create({
    code: 'W-01',
    name: 'College Ward',
    city: 'Metro City',
    center: { type: 'Point', coordinates: [85.82, 20.29] },
  });

  const passwordHash = await hashPassword('password123');
  const citizen = await User.create({
    name: 'Test Citizen',
    email: 'phase5.citizen@example.com',
    passwordHash,
    role: 'citizen',
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'phase5.citizen@example.com',
    password: 'password123',
  });

  return {
    department,
    ward,
    citizen,
    token: loginResponse.body.data.token,
  };
}

describe('Phase 5 — Powerful AI Tests', () => {
  it('Test 1 — Normal complaint: Large pothole near college gate', async () => {
    const { ward, token, department } = await setupPhase5Environment();

    const response = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Large pothole near college gate',
        description: 'There is a severe large pothole right in front of the main college gate causing traffic congestion and accidents.',
        category: 'pothole',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        location: 'College Gate Road',
      });

    expect(response.status).toBe(201);
    const grievance = response.body.data.grievance;

    // Checks:
    // Category → Road / pothole
    expect(['pothole', 'roads']).toContain(grievance.category);
    
    // Department → Public Works (ROADS)
    const deptCode = grievance.departmentId?.code || department.code;
    expect(deptCode).toBe('ROADS');

    // Severity → sensible value
    expect(['low', 'medium', 'high', 'critical']).toContain(grievance.severity);

    // Priority → calculated
    expect(grievance.priority).toBeTruthy();
    expect(typeof grievance.priorityScore).toBe('number');

    // Summary → generated
    expect(grievance.aiAnalysis.summary).toBeTruthy();
  });

  it('Test 2 — Hindi and Odia multilingual complaints', async () => {
    const { ward, token } = await setupPhase5Environment();

    // Hindi test
    const hindiRes = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'कॉलेज गेट के पास बड़ा गड्ढा है',
        description: 'मुख्य कॉलेज के द्वार के सामने एक बड़ा गड्ढा है जिससे दुर्घटनाएं हो रही हैं।',
        category: 'pothole',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        location: 'कॉलेज रोड',
      });

    expect(hindiRes.status).toBe(201);
    expect(hindiRes.body.data.grievance.originalLanguage).toBe('hi');
    expect(hindiRes.body.data.grievance.titleNormalized).toBeTruthy();

    // Odia test
    const odiaRes = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'ରାସ୍ତାରେ ବଡ଼ ଗାଡ଼ ଅଛି',
        description: 'କଲେଜ ଫାଟକ ନିକଟରେ ଗୋଟିଏ ବିପଜ୍ଜନକ ଗାଡ଼ ଅଛି।',
        category: 'pothole',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        location: 'କଲେଜ ରାସ୍ତା',
      });

    expect(odiaRes.status).toBe(201);
    expect(odiaRes.body.data.grievance.originalLanguage).toBe('or');
  });

  it('Test 3 — Image analysis for pothole/garbage/streetlight', async () => {
    const { ward, token } = await setupPhase5Environment();

    const response = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Streetlight image verification',
        description: 'Dark streetlight broken at dark night near college corner.',
        category: 'streetlight',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        location: 'College Corner',
        images: [{ url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65', mimeType: 'image/jpeg' }],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.grievance.aiStatus).toBe('completed');
    expect(response.body.data.grievance.aiAnalysis.imageAnalysis).toBeTruthy();
  });

  it('Test 4 — Duplicate detection', async () => {
    const { ward, token } = await setupPhase5Environment();

    // 1st Complaint
    const g1 = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'There is a huge pothole near the college gate',
        description: 'A large dangerous pothole near the college gate entrance is causing severe traffic risks.',
        category: 'pothole',
        wardId: ward._id.toString(),
        latitude: 20.2901,
        longitude: 85.8201,
        location: 'College Gate',
      });

    expect(g1.status).toBe(201);

    // 2nd Complaint (Very similar topic and location)
    const g2 = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'A large pothole has appeared beside the college gate',
        description: 'A large dangerous pothole near the college gate entrance needs urgent fixing.',
        category: 'pothole',
        wardId: ward._id.toString(),
        latitude: 20.2902,
        longitude: 85.8202,
        location: 'College Gate',
      });

    expect(g2.status).toBe(201);
    const secondGrievance = g2.body.data.grievance;

    // Should flag as possible duplicate candidate
    expect(secondGrievance.duplicateCandidates.length).toBeGreaterThan(0);
    expect(secondGrievance.duplicateCandidates[0].grievanceId.toString()).toBe(g1.body.data.grievance._id.toString());
  });

  it('Test 5 — Gemini failure fallback handling', async () => {
    const { ward, citizen } = await setupPhase5Environment();

    // Create a grievance
    const grievance = await Grievance.create({
      title: 'Pothole complaint during Gemini outage',
      description: 'Complaint submitted while Gemini AI is down or invalid API key.',
      category: 'pothole',
      wardId: ward._id,
      citizenId: citizen._id,
      latitude: 20.29,
      longitude: 85.82,
      location: { type: 'Point', coordinates: [85.82, 20.29] },
      status: 'submitted',
      aiStatus: 'pending',
    });

    // Run pipeline with forceFailure simulating API key error / network failure
    const result = await runIntelligencePipeline(grievance, { forceFailure: true });

    // Complaint must STILL exist and remain created with aiStatus = 'failed'
    expect(result.grievance.status).toBe('submitted');
    expect(result.grievance.aiStatus).toBe('failed');
    expect(result.textResult.success).toBe(false);
  });
});
