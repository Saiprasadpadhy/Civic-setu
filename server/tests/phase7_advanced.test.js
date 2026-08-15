import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Ward from '../src/models/Ward.js';
import Department from '../src/models/Department.js';
import Grievance from '../src/models/Grievance.js';
import BudgetProject from '../src/models/BudgetProject.js';
import BudgetVote from '../src/models/BudgetVote.js';
import ResolutionEvidence from '../src/models/ResolutionEvidence.js';
import { computeGrievanceSla, calculateSlaHours } from '../src/services/sla.service.js';
import { hashPassword } from '../src/utils/bcrypt.js';

let adminToken;
let citizenToken;
let officerToken;
let adminUser;
let citizenUser;
let officerUser;
let testWard;
let testDept;
let createdGrievanceId;
let testBudgetProjectId;

async function seedData() {
  testWard = await Ward.create({
    name: 'Ward 12 - Chandrasekharpur',
    code: 'W12',
    city: 'Bhubaneswar',
    center: { type: 'Point', coordinates: [85.8245, 20.2961] },
    population: 32000,
    isActive: true,
  });

  testDept = await Department.create({
    name: 'Roads & Public Infrastructure',
    code: 'RPI',
    categories: ['pothole', 'road_damage', 'sidewalk'],
    defaultSlaHours: 48,
    isActive: true,
  });

  const pwd = await hashPassword('Password123!');

  adminUser = await User.create({
    name: 'Admin Chief',
    email: 'admin.chief@civicsetu.gov.in',
    passwordHash: pwd,
    role: 'admin',
    wardId: testWard._id,
    isActive: true,
  });

  citizenUser = await User.create({
    name: 'Aarav Citizen',
    email: 'aarav.citizen@example.com',
    passwordHash: pwd,
    role: 'citizen',
    wardId: testWard._id,
    isActive: true,
  });

  officerUser = await User.create({
    name: 'Officer Rajesh',
    email: 'officer.rajesh@civicsetu.gov.in',
    passwordHash: pwd,
    role: 'officer',
    departmentId: testDept._id,
    wardId: testWard._id,
    isActive: true,
  });

  // Logins
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin.chief@civicsetu.gov.in', password: 'Password123!' });
  adminToken = adminLogin.body.data.token;

  const citizenLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'aarav.citizen@example.com', password: 'Password123!' });
  citizenToken = citizenLogin.body.data.token;

  const officerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'officer.rajesh@civicsetu.gov.in', password: 'Password123!' });
  officerToken = officerLogin.body.data.token;
}

describe('Phase 7: Advanced Features Test Suite', () => {
  beforeEach(async () => {
    await seedData();
  });

  describe('1. SLA Engine & Calculation System', () => {
    it('calculates correct SLA hours based on department and priority', () => {
      const criticalSla = calculateSlaHours({ defaultSlaHours: 48, priority: 'critical' });
      expect(criticalSla).toBe(24);

      const highSla = calculateSlaHours({ defaultSlaHours: 48, priority: 'high' });
      expect(highSla).toBe(48);

      const lowSla = calculateSlaHours({ defaultSlaHours: 48, priority: 'low' });
      expect(lowSla).toBe(48); // limited by department defaultSlaHours of 48
    });

    it('computes live SLA deadline, overdue status, and risk scores', () => {
      const now = new Date();
      const pastCreated = new Date(now.getTime() - 50 * 60 * 60 * 1000); // 50 hours ago

      const overdueGrievance = {
        createdAt: pastCreated,
        status: 'in_progress',
        priority: 'high',
        sla: {
          hoursAllocated: 48,
          predictedDueAt: new Date(pastCreated.getTime() + 48 * 60 * 60 * 1000), // 2 hours overdue
        },
      };

      const slaResult = computeGrievanceSla(overdueGrievance, now);
      expect(slaResult.isOverdue).toBe(true);
      expect(slaResult.status).toBe('breached');
      expect(slaResult.riskScore).toBe(100);
      expect(slaResult.hoursRemaining).toBeLessThan(0);
    });

    it('computes on-track and at-risk SLA statuses correctly', () => {
      const now = new Date();
      const recentCreated = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

      const onTrackGrievance = {
        createdAt: recentCreated,
        status: 'assigned',
        priority: 'medium',
        sla: {
          hoursAllocated: 72,
          predictedDueAt: new Date(recentCreated.getTime() + 72 * 60 * 60 * 1000),
        },
      };

      const onTrackResult = computeGrievanceSla(onTrackGrievance, now);
      expect(onTrackResult.isOverdue).toBe(false);
      expect(onTrackResult.status).toBe('on_track');
      expect(onTrackResult.riskScore).toBeLessThan(50);
    });
  });

  describe('2. Grievance Creation with Initial SLA', () => {
    it('creates grievance and initializes SLA fields automatically', async () => {
      const res = await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Dangerous deep pothole near main traffic circle',
          description: 'Large pothole on the right lane causing vehicles to swerve into oncoming traffic.',
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
          location: 'Main Traffic Circle, Chandrasekharpur',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grievance).toBeDefined();

      const g = res.body.data.grievance;
      createdGrievanceId = g._id;

      expect(g.ticketId).toMatch(/^CS-\d{4}-\d{6}$/);
      expect(g.sla).toBeDefined();
      expect(g.sla.hoursAllocated).toBeGreaterThan(0);
      expect(g.sla.predictedDueAt).toBeDefined();
      expect(g.sla.status).toBe('on_track');
    });
  });

  describe('3. Resolution Evidence & Remarks Workflow', () => {
    it('allows officer to add remark and upload resolution evidence (photo and document)', async () => {
      // Create a test grievance first
      const createRes = await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Dangerous deep pothole for resolution test',
          description: 'Road damage repair test.',
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
        });

      const gid = createRes.body.data.grievance._id;

      // 1. Assign officer
      await request(app)
        .patch(`/api/admin/grievances/${gid}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officerId: officerUser._id.toString() });

      // 2. Officer moves status to in_progress
      await request(app)
        .patch(`/api/officer/grievances/${gid}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ status: 'in_progress', note: 'Work commenced.' });

      // 3. Officer adds remark
      const remarkRes = await request(app)
        .post(`/api/officer/grievances/${gid}/remark`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ note: 'Field inspection completed. Repair crew deployed on site.' });

      expect(remarkRes.status).toBe(200);
      expect(remarkRes.body.success).toBe(true);

      // 3. Officer uploads resolution photo evidence
      const photoEvidenceRes = await request(app)
        .post(`/api/officer/grievances/${gid}/evidence`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
          mimeType: 'image/jpeg',
          evidenceType: 'after',
          caption: 'Road surface patched and asphalt cured',
          notes: 'Completed according to standard civic specifications.',
        });

      expect(photoEvidenceRes.status).toBe(201);
      expect(photoEvidenceRes.body.success).toBe(true);
      expect(photoEvidenceRes.body.data.evidence.evidenceType).toBe('after');

      // 4. Officer uploads resolution document certificate
      const docEvidenceRes = await request(app)
        .post(`/api/officer/grievances/${gid}/evidence`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          url: 'https://civicsetu.gov.in/docs/cert-001.pdf',
          mimeType: 'application/pdf',
          evidenceType: 'document',
          caption: 'Municipal Engineering Quality Certificate',
          notes: 'Formal inspection sign-off certificate.',
        });

      expect(docEvidenceRes.status).toBe(201);
      expect(docEvidenceRes.body.data.evidence.evidenceType).toBe('document');

      // 5. Citizen retrieves evidence
      const getEvidenceRes = await request(app)
        .get(`/api/grievances/${gid}/evidence`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(getEvidenceRes.status).toBe(200);
      expect(getEvidenceRes.body.data.evidence.length).toBe(2);

      // 6. Officer resolves grievance
      const resolveRes = await request(app)
        .post(`/api/officer/grievances/${gid}/resolve`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ resolutionSummary: 'Pothole fully repaired, inspected, and traffic restored.' });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.grievance.status).toBe('resolved');
      expect(resolveRes.body.data.grievance.sla.resolvedAt).toBeDefined();
      expect(resolveRes.body.data.grievance.sla.status).toBe('met');
    });
  });

  describe('4. Backend Analytics Aggregation Suite', () => {
    it('returns structured municipal KPI aggregations and time-series trends', async () => {
      // Create sample grievance
      await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Analytics test pothole',
          description: 'Analytics test description.',
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
        });

      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.kpis).toBeDefined();
      expect(data.kpis.total).toBeGreaterThanOrEqual(1);
      expect(data.kpis.resolutionRate).toBeDefined();
      expect(data.kpis.avgResolutionHours).toBeDefined();

      expect(data.slaCompliance).toBeDefined();
      expect(data.slaCompliance.complianceRate).toBeDefined();

      expect(Array.isArray(data.byCategory)).toBe(true);
      expect(Array.isArray(data.byDepartment)).toBe(true);
      expect(Array.isArray(data.byWard)).toBe(true);
      expect(Array.isArray(data.byPriority)).toBe(true);
      expect(Array.isArray(data.trends)).toBe(true);
    });
  });

  describe('5. Ward Heatmap Backend Aggregation', () => {
    it('returns privacy-safe aggregated density points with zero private citizen data', async () => {
      await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Heatmap test pothole',
          description: 'Heatmap test description.',
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
        });

      const res = await request(app)
        .get('/api/admin/analytics/heatmap')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(Array.isArray(data.wards)).toBe(true);
      expect(Array.isArray(data.densityPoints)).toBe(true);

      if (data.densityPoints.length > 0) {
        const pt = data.densityPoints[0];
        expect(pt.latitude).toBeDefined();
        expect(pt.longitude).toBeDefined();
        expect(pt.count).toBeGreaterThanOrEqual(1);
        expect(pt.intensity).toBeDefined();

        // Ensure ZERO private citizen information is leaked
        expect(pt.citizenId).toBeUndefined();
        expect(pt.citizenName).toBeUndefined();
        expect(pt.citizenEmail).toBeUndefined();
        expect(pt.citizenPhone).toBeUndefined();
      }
    });

    it('filters heatmap by category and priority correctly', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/heatmap')
        .query({ category: 'pothole' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('6. SLA Monitoring Radar Endpoint', () => {
    it('returns prioritized SLA radar list with countdown calculations', async () => {
      await request(app)
        .post('/api/grievances')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'SLA Radar test pothole',
          description: 'SLA Radar description.',
          category: 'pothole',
          wardId: testWard._id.toString(),
          latitude: 20.2961,
          longitude: 85.8245,
        });

      const res = await request(app)
        .get('/api/admin/analytics/sla')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);

      if (res.body.data.items.length > 0) {
        const item = res.body.data.items[0];
        expect(item.ticketId).toBeDefined();
        expect(item.hoursAllocated).toBeDefined();
        expect(item.predictedDueAt).toBeDefined();
        expect(item.slaStatus).toBeDefined();
        expect(item.riskScore).toBeDefined();
      }
    });
  });

  describe('7. Public Works & Participatory Budgeting Engine', () => {
    it('allows admin to create a community budget project', async () => {
      const res = await request(app)
        .post('/api/budget-projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Solar Smart Streetlights Corridor',
          description: 'Install 50 solar LED streetlights along the main school and transit route.',
          wardId: testWard._id.toString(),
          departmentId: testDept._id.toString(),
          category: 'lighting',
          estimatedCost: 750000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.title).toBe('Solar Smart Streetlights Corridor');
      testBudgetProjectId = res.body.data.project._id;
    });

    it('allows citizen to vote (one vote per project) and withdraw vote', async () => {
      const project = await BudgetProject.create({
        title: 'Community Garden & Park',
        description: 'Green zone development.',
        wardId: testWard._id,
        category: 'parks',
        estimatedCost: 300000,
        createdById: adminUser._id,
        status: 'voting_open',
        isPublished: true,
      });

      // 1. Citizen votes
      const voteRes = await request(app)
        .post(`/api/budget-projects/${project._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(voteRes.status).toBe(200);
      expect(voteRes.body.success).toBe(true);
      expect(voteRes.body.data.hasVoted).toBe(true);
      expect(voteRes.body.data.project.voteCount).toBe(1);

      // 2. Citizen votes again -> toggles vote withdrawal
      const unvoteRes = await request(app)
        .post(`/api/budget-projects/${project._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(unvoteRes.status).toBe(200);
      expect(unvoteRes.body.data.hasVoted).toBe(false);
      expect(unvoteRes.body.data.project.voteCount).toBe(0);

      // 3. Re-cast vote for simulation test
      await request(app)
        .post(`/api/budget-projects/${project._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`);
    });

    it('runs pure backend participatory budget simulation with cutoff limit and vote ranking', async () => {
      await BudgetProject.create({
        title: 'Drainage Overhaul Phase 1',
        description: 'Stormwater channel expansion.',
        wardId: testWard._id,
        category: 'drainage',
        estimatedCost: 600000,
        createdById: adminUser._id,
        status: 'voting_open',
        isPublished: true,
        voteCount: 5,
      });

      const res = await request(app)
        .post('/api/budget-projects/simulate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          budgetEnvelope: 1000000, // 10 Lakhs
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const sim = res.body.data;
      expect(sim.availableBudget).toBe(1000000);
      expect(sim.selectedCost).toBe(600000);
      expect(sim.remainingBudget).toBe(400000);
      expect(sim.isOverBudget).toBe(false);
      expect(sim.fundedCount).toBe(1);
      expect(Array.isArray(sim.voteRanking)).toBe(true);
      expect(sim.voteRanking[0].rank).toBe(1);
    });

    it('allows admin to open and close project voting window', async () => {
      const project = await BudgetProject.create({
        title: 'Project for voting toggle',
        description: 'Toggle test.',
        wardId: testWard._id,
        estimatedCost: 200000,
        createdById: adminUser._id,
        status: 'voting_open',
        isPublished: true,
      });

      const res = await request(app)
        .patch(`/api/budget-projects/${project._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'voting_closed' });

      expect(res.status).toBe(200);
      expect(res.body.data.project.status).toBe('voting_closed');

      // Verify citizen cannot vote when voting is closed
      const blockedVoteRes = await request(app)
        .post(`/api/budget-projects/${project._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(blockedVoteRes.status).toBe(400);
      expect(blockedVoteRes.body.message).toMatch(/Voting is currently closed/i);
    });
  });
});
