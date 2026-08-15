import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Ward from '../src/models/Ward.js';
import Department from '../src/models/Department.js';
import Grievance from '../src/models/Grievance.js';
import BudgetProject from '../src/models/BudgetProject.js';
import ResolutionEvidence from '../src/models/ResolutionEvidence.js';
import { hashPassword } from '../src/utils/bcrypt.js';
import { signToken } from '../src/utils/jwt.js';
import { authLimiter } from '../src/middleware/rateLimiter.js';
import { calculateSlaHours, computeGrievanceSla } from '../src/services/sla.service.js';

let adminToken;
let citizen1Token;
let citizen2Token;
let officerToken;
let adminUser;
let citizen1User;
let citizen2User;
let officerUser;
let testWard;
let testDeptRoads;
let testDeptSanitation;

async function seedSuiteData() {
  authLimiter.reset();

  testWard = await Ward.create({
    name: 'Ward 15 - Saheed Nagar',
    code: 'W15',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8245, 20.2961] },
    population: 28000,
    isActive: true,
  });

  testDeptRoads = await Department.create({
    name: 'Roads & Infrastructure',
    code: 'ROADS',
    categories: ['pothole', 'roads', 'streetlight'],
    defaultSlaHours: 48,
    isActive: true,
  });

  testDeptSanitation = await Department.create({
    name: 'Sanitation & Solid Waste',
    code: 'SANITATION',
    categories: ['garbage', 'drainage', 'sanitation'],
    defaultSlaHours: 72,
    isActive: true,
  });

  const pwd = await hashPassword('Test@123');

  adminUser = await User.create({
    name: 'Super Admin',
    email: 'admin.audit@civicsetu.gov.in',
    passwordHash: pwd,
    role: 'admin',
    wardId: testWard._id,
    isActive: true,
  });

  citizen1User = await User.create({
    name: 'Citizen Vikram',
    email: 'vikram.citizen@example.com',
    passwordHash: pwd,
    role: 'citizen',
    wardId: testWard._id,
    isActive: true,
  });

  citizen2User = await User.create({
    name: 'Citizen Sneha',
    email: 'sneha.citizen@example.com',
    passwordHash: pwd,
    role: 'citizen',
    wardId: testWard._id,
    isActive: true,
  });

  officerUser = await User.create({
    name: 'Officer Ramesh',
    email: 'officer.roads@test.com',
    passwordHash: pwd,
    role: 'officer',
    departmentId: testDeptRoads._id,
    wardId: testWard._id,
    isActive: true,
  });

  adminToken = signToken({ userId: adminUser._id.toString(), role: adminUser.role });
  citizen1Token = signToken({ userId: citizen1User._id.toString(), role: citizen1User.role });
  citizen2Token = signToken({ userId: citizen2User._id.toString(), role: citizen2User.role });
  officerToken = signToken({ userId: officerUser._id.toString(), role: officerUser.role });
}

describe('Phase 8: Complete CivicSetu Testing & Security Audit', () => {
  beforeEach(async () => {
    await seedSuiteData();
  });

  // ==========================================
  // SECTION 1: AUTOMATED UNIT & FEATURE TESTS
  // ==========================================
  describe('1. Automated Feature Tests', () => {
    it('handles citizen registration and duplicate email rejection', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .set('x-skip-rate-limit', 'true')
        .send({
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          password: 'Password123!',
          preferredLanguage: 'hi',
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.data.user.email).toBe('priya.sharma@example.com');
      expect(regRes.body.data.token).toBeDefined();

      // Duplicate registration attempt
      const dupRes = await request(app)
        .post('/api/auth/register')
        .set('x-skip-rate-limit', 'true')
        .send({
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          password: 'Password123!',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.message).toMatch(/already registered|already exists/i);
    });

    it('authenticates valid login and rejects invalid password', async () => {
      const validLogin = await request(app)
        .post('/api/auth/login')
        .set('x-skip-rate-limit', 'true')
        .send({ email: 'vikram.citizen@example.com', password: 'Test@123' });

      expect(validLogin.status).toBe(200);
      expect(validLogin.body.data.token).toBeDefined();

      const invalidLogin = await request(app)
        .post('/api/auth/login')
        .set('x-skip-rate-limit', 'true')
        .send({ email: 'vikram.citizen@example.com', password: 'WrongPassword!' });

      expect(invalidLogin.status).toBe(401);
      expect(invalidLogin.body.message).toMatch(/invalid/i);
    });

    it('calculates dynamic SLA targets and handles priority scoring', async () => {
      const criticalHours = calculateSlaHours({ defaultSlaHours: 48, priority: 'critical' });
      expect(criticalHours).toBe(24);

      const highHours = calculateSlaHours({ defaultSlaHours: 48, priority: 'high' });
      expect(highHours).toBe(48);

      const past = new Date(Date.now() - 30 * 60 * 60 * 1000);
      const grievanceMock = {
        createdAt: past,
        status: 'in_progress',
        priority: 'critical',
        sla: {
          hoursAllocated: 24,
          predictedDueAt: new Date(past.getTime() + 24 * 60 * 60 * 1000), // 6 hours overdue
        },
      };

      const computed = computeGrievanceSla(grievanceMock);
      expect(computed.isOverdue).toBe(true);
      expect(computed.status).toBe('breached');
      expect(computed.riskScore).toBe(100);
    });
  });

  // ==========================================
  // SECTION 2: SECURITY AUDIT
  // ==========================================
  describe('2. Security Audit & Vulnerability Tests', () => {
    it('[RBAC] strictly prevents citizens from accessing admin or officer endpoints', async () => {
      const adminOnlyRes = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(adminOnlyRes.status).toBe(403);
      expect(adminOnlyRes.body.message).toMatch(/permission/i);

      const officerOnlyRes = await request(app)
        .get('/api/officer/grievances')
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(officerOnlyRes.status).toBe(403);
    });

    it('[IDOR] prevents Citizen A from reading or modifying Citizen B grievance', async () => {
      // Citizen 1 creates a grievance
      const createRes = await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizen1Token}`)
        .send({
          title: 'Private leak in backyard pipeline',
          description: 'Water leaking heavily near private meter boundary.',
          category: 'water',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
        });

      const gid = createRes.body.data.grievance._id;

      // Citizen 2 attempts to fetch Citizen 1's grievance
      const crossAccessRes = await request(app)
        .get(`/api/grievances/${gid}`)
        .set('Authorization', `Bearer ${citizen2Token}`);

      expect(crossAccessRes.status).toBe(403);
      expect(crossAccessRes.body.message).toMatch(/permission/i);
    });

    it('[NoSQL Injection] sanitizes $gt/$ne operators in request body and query', async () => {
      const injectionAttempt = await request(app)
        .post('/api/auth/login')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: { $gt: '' },
          password: 'Test@123',
        });

      // Sanitizer strips $gt object, causing validation to reject missing string email
      expect(injectionAttempt.status).toBe(400);
      expect(injectionAttempt.body.message).toMatch(/valid email is required/i);
    });

    it('[XSS & Unsafe URLs] rejects javascript: and unsafe protocol image URLs', async () => {
      const xssRes = await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizen1Token}`)
        .send({
          title: 'Dangerous pothole on street',
          description: 'Large crater in front of the gate causing accidents.',
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
          images: [
            {
              url: 'javascript:alert(document.cookie)',
              mimeType: 'image/jpeg',
            },
          ],
        });

      expect(xssRes.status).toBe(400);
      expect(xssRes.body.message).toMatch(/unsafe or unsupported URL protocol/i);
    });

    it('[JWT Security] rejects forged or tampered JWT signatures', async () => {
      const forgedToken = citizen1Token.slice(0, -5) + 'abcde';

      const tamperedRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(tamperedRes.status).toBe(401);
      expect(tamperedRes.body.message).toMatch(/invalid|expired token/i);
    });

    it('[Rate Limiting] enforces HTTP 429 and retry headers when threshold exceeded', async () => {
      // Send 16 rapid login attempts with rate limit test header
      let lastRes;
      for (let i = 0; i < 16; i++) {
        lastRes = await request(app)
          .post('/api/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: 'test.ratelimit@example.com', password: 'bad' });
      }

      expect(lastRes.status).toBe(429);
      expect(lastRes.body.message).toMatch(/too many requests/i);
      expect(lastRes.headers['retry-after']).toBeDefined();
      expect(lastRes.headers['x-ratelimit-limit']).toBe('15');
      expect(lastRes.headers['x-ratelimit-remaining']).toBe('0');
    });
  });

  // ==========================================
  // SECTION 3: EDGE CASES & RESILIENCY
  // ==========================================
  describe('3. Edge Cases & Resiliency', () => {
    it('rejects empty and undersized complaint inputs', async () => {
      const emptyRes = await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizen1Token}`)
        .send({
          title: 'Hi',
          description: 'Short',
          category: '',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
        });

      expect(emptyRes.status).toBe(400);
    });

    it('rejects oversized complaints exceeding max length limits', async () => {
      const hugeDescription = 'a'.repeat(5005);
      const hugeRes = await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizen1Token}`)
        .send({
          title: 'Valid Title',
          description: hugeDescription,
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
        });

      expect(hugeRes.status).toBe(400);
      expect(hugeRes.body.message).toMatch(/cannot exceed 5000 characters/i);
    });

    it('handles malformed ObjectIds with clean 400 Bad Request error', async () => {
      const malformedRes = await request(app)
        .get('/api/grievances/not-a-valid-object-id')
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(malformedRes.status).toBe(400);
      expect(malformedRes.body.message).toMatch(/Invalid/i);
    });

    it('returns 404 for non-existent valid ObjectId grievance', async () => {
      const nonExistentId = '666666666666666666666666';
      const notFoundRes = await request(app)
        .get(`/api/grievances/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.message).toMatch(/not found/i);
    });

    it('prevents duplicate votes on public works project', async () => {
      const project = await BudgetProject.create({
        title: 'Edge Case Solar Lights',
        description: 'Solar lighting for school lane.',
        wardId: testWard._id,
        category: 'lighting',
        estimatedCost: 400000,
        createdById: adminUser._id,
        status: 'voting_open',
        isPublished: true,
      });

      // Vote 1: Citizen votes -> success
      const vote1 = await request(app)
        .post(`/api/budget-projects/${project._id}/vote`)
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(vote1.status).toBe(200);
      expect(vote1.body.data.hasVoted).toBe(true);
      expect(vote1.body.data.project.voteCount).toBe(1);

      // Vote 2: Citizen votes again -> gracefully toggles vote withdrawal
      const vote2 = await request(app)
        .post(`/api/budget-projects/${project._id}/vote`)
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(vote2.status).toBe(200);
      expect(vote2.body.data.hasVoted).toBe(false);
      expect(vote2.body.data.project.voteCount).toBe(0);
    });

    it('accurately detects over-budget scenarios in participatory budget simulator', async () => {
      const project = await BudgetProject.create({
        title: 'Expensive Mega Flyover Phase 1',
        description: 'Flyover construction.',
        wardId: testWard._id,
        category: 'roads',
        estimatedCost: 15000000, // 1.5 Crore
        createdById: adminUser._id,
        status: 'voting_open',
        isPublished: true,
      });

      const simRes = await request(app)
        .post('/api/budget-projects/simulate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          budgetEnvelope: 5000000, // 50 Lakh budget
          selectedProjectIds: [project._id.toString()],
        });

      expect(simRes.status).toBe(200);
      const sim = simRes.body.data;
      expect(sim.availableBudget).toBe(5000000);
      expect(sim.selectedCost).toBe(15000000);
      expect(sim.isOverBudget).toBe(true);
      expect(sim.overBudgetAmount).toBe(10000000);
      expect(sim.remainingBudget).toBe(0);
      expect(sim.unallocatedProjects.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // SECTION 4: FULL END-TO-END DEMO JOURNEY
  // ==========================================
  describe('4. Complete End-to-End Demo Journey', () => {
    it('runs the complete citizen lifecycle from submission to resolution proof and admin analytics', async () => {
      // 1. Citizen submits multilingual grievance with photo evidence
      const submitRes = await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizen1Token}`)
        .send({
          title: 'मुख्य मार्ग पर बड़ा गड्ढा (Large pothole on main road)',
          description: 'कॉलेज गेट के पास सड़क पर बहुत बड़ा गड्ढा है जिससे दुर्घटना का खतरा बना रहता है।',
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
          location: 'Saheed Nagar Main Road, near DAV School',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
              mimeType: 'image/jpeg',
              caption: 'Damaged road crater',
            },
          ],
        });

      expect(submitRes.status).toBe(201);
      const grievance = submitRes.body.data.grievance;
      const gid = grievance._id;

      expect(grievance.ticketId).toMatch(/^CS-\d{4}-\d{6}$/);
      expect(grievance.aiStatus).toBe('completed');
      expect(grievance.priority).toBeDefined();
      expect(grievance.sla).toBeDefined();

      // 2. Verify auto-assignment to Roads officer
      expect(grievance.assignedOfficerId).toBeDefined();

      // 3. Officer claims ticket and transitions status to in_progress
      const claimRes = await request(app)
        .post(`/api/officer/grievances/${gid}/claim`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(claimRes.status).toBe(200);
      expect(claimRes.body.data.grievance.status).toBe('assigned');

      const progressRes = await request(app)
        .patch(`/api/officer/grievances/${gid}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ status: 'in_progress', note: 'Dispatch team deployed with asphalt cold mix.' });

      expect(progressRes.status).toBe(200);
      expect(progressRes.body.data.grievance.status).toBe('in_progress');

      // 4. Officer adds field remark
      const remarkRes = await request(app)
        .post(`/api/officer/grievances/${gid}/remarks`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ note: 'Patching work completed. Surface compaction under inspection.' });

      expect(remarkRes.status).toBe(200);

      // 5. Officer uploads resolution photo evidence
      const photoRes = await request(app)
        .post(`/api/officer/grievances/${gid}/evidence`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
          mimeType: 'image/jpeg',
          evidenceType: 'after',
          caption: 'Road surface completely repaved and leveled',
          notes: 'Completed according to standard civic specifications.',
        });

      expect(photoRes.status).toBe(201);
      expect(photoRes.body.data.evidence.evidenceType).toBe('after');

      // 6. Officer uploads formal PDF inspection certificate
      const docRes = await request(app)
        .post(`/api/officer/grievances/${gid}/evidence`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          url: 'https://civicsetu.gov.in/certificates/signoff-9821.pdf',
          mimeType: 'application/pdf',
          evidenceType: 'document',
          caption: 'Ward Quality Sign-Off Certificate',
        });

      expect(docRes.status).toBe(201);

      // 7. Officer resolves the grievance
      const resolveRes = await request(app)
        .post(`/api/officer/grievances/${gid}/resolve`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          resolutionSummary: 'Pothole permanently filled with asphalt and steam-rolled. Traffic flow fully restored.',
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.grievance.status).toBe('resolved');
      expect(resolveRes.body.data.grievance.sla.status).toBe('met');

      // 8. Citizen inspects resolved grievance and views resolution proof
      const citizenViewRes = await request(app)
        .get(`/api/grievances/${gid}`)
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(citizenViewRes.status).toBe(200);
      expect(citizenViewRes.body.data.grievance.status).toBe('resolved');

      const evidenceListRes = await request(app)
        .get(`/api/grievances/${gid}/evidence`)
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(evidenceListRes.status).toBe(200);
      expect(evidenceListRes.body.data.evidence.length).toBe(2);

      // 9. Citizen closes the resolved ticket
      const closeRes = await request(app)
        .post(`/api/grievances/${gid}/close`)
        .set('Authorization', `Bearer ${citizen1Token}`);

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.grievance.status).toBe('closed');

      // 10. Admin inspects updated citywide analytics, heatmap, and SLA radar
      const analyticsRes = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.data.kpis.resolved).toBeGreaterThanOrEqual(1);

      const heatmapRes = await request(app)
        .get('/api/admin/analytics/heatmap')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(heatmapRes.status).toBe(200);
      expect(heatmapRes.body.data.densityPoints.length).toBeGreaterThan(0);

      const slaRadarRes = await request(app)
        .get('/api/admin/analytics/sla')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(slaRadarRes.status).toBe(200);
      expect(slaRadarRes.body.data.stats).toBeDefined();
    });
  });
});
