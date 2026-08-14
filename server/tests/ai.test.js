import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import Ward from '../src/models/Ward.js';
import Grievance from '../src/models/Grievance.js';
import { hashPassword } from '../src/utils/bcrypt.js';
import { computePriority } from '../src/services/priority.service.js';
import { detectSpam } from '../src/services/spam.service.js';
import { detectDuplicates } from '../src/services/duplicate.service.js';
import {
  analyzeText,
  analyzeImage,
  createInvalidTextOutput,
} from '../src/ai/gemini.client.js';
import {
  validateTextAnalysisOutput,
} from '../src/ai/validators/output.validator.js';
import { jaccardSimilarity } from '../src/utils/textSimilarity.js';

async function seedBaseData() {
  const department = await Department.create({
    code: 'ROADS',
    name: 'Roads Department',
    categories: ['streetlight', 'pothole', 'roads'],
    defaultSlaHours: 72,
    contactEmail: 'roads@test.com',
  });

  const ward = await Ward.create({
    code: 'AI-W1',
    name: 'AI Ward',
    city: 'Test City',
    center: { type: 'Point', coordinates: [85.82, 20.29] },
  });

  const passwordHash = await hashPassword('password123');
  const citizen = await User.create({
    name: 'AI Citizen',
    email: 'ai.citizen@example.com',
    passwordHash,
    role: 'citizen',
  });

  return { department, ward, citizen };
}

describe('AI Intelligence System', () => {
  it('runs successful AI analysis on grievance submission', async () => {
    const { ward, citizen } = await seedBaseData();
    const login = await request(app).post('/api/auth/login').send({
      email: 'ai.citizen@example.com',
      password: 'password123',
    });
    const token = login.body.data.token;

    const response = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Streetlight not working',
        description: 'The streetlight near the junction has been off for five days.',
        category: 'streetlight',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        location: 'Junction road',
        images: [{ url: 'https://example.com/light.jpg', mimeType: 'image/jpeg' }],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.grievance.aiStatus).toBe('completed');
    expect(response.body.data.grievance.aiAnalysis.summary).toBeTruthy();
    expect(response.body.data.grievance.priority).toBeTruthy();
    expect(response.body.data.grievance.titleNormalized).toBeTruthy();
    expect(response.body.data.grievance.originalLanguage).toBe('en');

    const aiResponse = await request(app)
      .get(`/api/ai/grievances/${response.body.data.grievance._id}/ai`)
      .set('Authorization', `Bearer ${token}`);

    expect(aiResponse.status).toBe(200);
    expect(aiResponse.body.data.aiStatus).toBe('completed');
    expect(aiResponse.body.data.analysis.imageAnalysis.likelyIssue).toBeTruthy();
  });

  it('handles multilingual Hindi input', async () => {
    const { ward } = await seedBaseData();
    const passwordHash = await hashPassword('password123');
    await User.create({
      name: 'Hindi Citizen',
      email: 'hindi.citizen@example.com',
      passwordHash,
      role: 'citizen',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'hindi.citizen@example.com',
      password: 'password123',
    });

    const response = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .send({
        title: 'सड़क की रोशनी खराब है',
        description: 'पिछले पांच दिनों से मुख्य सड़क पर स्ट्रीट लाइट काम नहीं कर रही है।',
        category: 'streetlight',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        location: 'Main road',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.grievance.originalLanguage).toBe('hi');
    expect(response.body.data.grievance.titleNormalized).toBeTruthy();
  });

  it('continues grievance creation when Gemini text analysis fails', async () => {
    const { ward } = await seedBaseData();
    const passwordHash = await hashPassword('password123');
    await User.create({
      name: 'Fail Citizen',
      email: 'fail.citizen@example.com',
      passwordHash,
      role: 'citizen',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'fail.citizen@example.com',
      password: 'password123',
    });

    const originalAnalyzeText = analyzeText;
    const { runIntelligencePipeline } = await import('../src/services/aiIntelligence.service.js');

    const grievance = await Grievance.create({
      title: 'Test fail flow',
      description: 'This grievance should survive AI failure.',
      category: 'streetlight',
      wardId: ward._id,
      citizenId: (await User.findOne({ email: 'fail.citizen@example.com' }))._id,
      latitude: 20.29,
      longitude: 85.82,
      location: { type: 'Point', coordinates: [85.82, 20.29] },
      status: 'submitted',
      aiStatus: 'pending',
    });

    const result = await runIntelligencePipeline(grievance, { forceFailure: true });
    expect(result.grievance.aiStatus).toBe('failed');
    expect(result.grievance.status).toBe('submitted');
    expect(result.textResult.success).toBe(false);
  });

  it('rejects invalid AI output during validation', () => {
    expect(() => validateTextAnalysisOutput(createInvalidTextOutput())).toThrow();
  });

  it('scores priority deterministically independent of Gemini labels', () => {
    const result = computePriority({
      severity: 'high',
      safetyImpact: 0.8,
      affectedPopulation: 0.6,
      essentialServiceImpact: 0.5,
      recurrence: 0.2,
      vulnerability: 0.4,
    });

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.priority);
    expect(result.explanation).toContain('score');
  });

  it('detects spam patterns without banning users', async () => {
    const { ward, citizen } = await seedBaseData();

    await Grievance.create({
      title: 'test',
      description: 'test',
      category: 'garbage',
      wardId: ward._id,
      citizenId: citizen._id,
      latitude: 20.29,
      longitude: 85.82,
      location: { type: 'Point', coordinates: [85.82, 20.29] },
      status: 'submitted',
    });

    const spam = await detectSpam({
      citizenId: citizen._id,
      title: 'test',
      description: 'test',
    });

    expect(spam.score).toBeGreaterThan(0);
    expect(spam.isSpam).toBe(true);
    expect(spam.reasons.length).toBeGreaterThan(0);
  });

  it('detects duplicate grievances without auto-merge', async () => {
    const { ward, citizen } = await seedBaseData();

    const original = await Grievance.create({
      title: 'Broken streetlight near junction',
      description: 'Streetlight has not worked for five days near the main junction.',
      titleNormalized: 'Broken streetlight near junction',
      descriptionNormalized: 'Streetlight has not worked for five days near the main junction.',
      category: 'streetlight',
      wardId: ward._id,
      citizenId: citizen._id,
      latitude: 20.29,
      longitude: 85.82,
      location: { type: 'Point', coordinates: [85.82, 20.29] },
      status: 'submitted',
    });

    const duplicates = await detectDuplicates({
      title: 'Broken streetlight at junction',
      description: 'Streetlight not working for five days near main junction.',
      titleNormalized: 'Broken streetlight at junction',
      descriptionNormalized: 'Streetlight not working for five days near main junction.',
      category: 'streetlight',
      wardId: ward._id,
      longitude: 85.8205,
      latitude: 20.2905,
    });

    expect(duplicates.possibleDuplicates.length).toBeGreaterThan(0);
    expect(duplicates.possibleDuplicates[0].grievanceId.toString()).toBe(original._id.toString());
    expect(jaccardSimilarity('broken streetlight', 'broken streetlight junction')).toBeGreaterThan(0);
  });

  it('supports AI preview and retry endpoints', async () => {
    const { ward } = await seedBaseData();
    const passwordHash = await hashPassword('password123');
    await User.create({
      name: 'Retry Citizen',
      email: 'retry.citizen@example.com',
      passwordHash,
      role: 'citizen',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'retry.citizen@example.com',
      password: 'password123',
    });
    const token = login.body.data.token;

    const preview = await request(app)
      .post('/api/ai/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Water leakage',
        description: 'Major water pipeline leakage flooding the street.',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        imageUrl: 'https://example.com/leak.jpg',
        mimeType: 'image/jpeg',
      });

    expect(preview.status).toBe(200);
    expect(preview.body.data.aiStatus).toBe('completed');
    expect(preview.body.data.textAnalysis.category).toBeTruthy();

    const create = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Water leakage',
        description: 'Major water pipeline leakage flooding the street.',
        category: 'water',
        wardId: ward._id.toString(),
        latitude: 20.29,
        longitude: 85.82,
        location: 'Street 7',
      });

    const grievanceId = create.body.data.grievance._id;

    const retry = await request(app)
      .post(`/api/ai/grievances/${grievanceId}/ai/retry`)
      .set('Authorization', `Bearer ${token}`);

    expect(retry.status).toBe(200);
    expect(retry.body.data.aiStatus).toBe('completed');

    const duplicates = await request(app)
      .get(`/api/ai/grievances/${grievanceId}/duplicates`)
      .set('Authorization', `Bearer ${token}`);

    expect(duplicates.status).toBe(200);
    expect(duplicates.body.data.explanation).toBeTruthy();
  });

  it('handles image analysis failure without blocking grievance completion', async () => {
    const imageResult = await analyzeImage({
      imageUrl: 'https://example.com/bad.jpg',
      mimeType: 'image/jpeg',
      forceFailure: true,
    });

    expect(imageResult.success).toBe(false);
    expect(imageResult.error).toBeTruthy();

    const textResult = await analyzeText({
      title: 'Pothole on road',
      description: 'Large pothole causing traffic issues.',
    });
    expect(textResult.success).toBe(true);
  });
});
