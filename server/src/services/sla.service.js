import Department from '../models/Department.js';
import Grievance from '../models/Grievance.js';

const PRIORITY_SLA_HOURS = {
  critical: 24,
  high: 48,
  medium: 72,
  low: 120,
};

/**
 * Calculates SLA hours allocated based on department default and grievance priority.
 */
export function calculateSlaHours({ defaultSlaHours = 72, priority = 'medium' }) {
  const priorityHours = PRIORITY_SLA_HOURS[priority] || 72;
  const deptHours = defaultSlaHours || 72;
  // Blend department standard and priority urgency
  return Math.min(deptHours, priorityHours);
}

/**
 * Computes live SLA parameters for a grievance.
 */
export function computeGrievanceSla(grievance, now = new Date()) {
  const createdAt = grievance.createdAt ? new Date(grievance.createdAt) : new Date();
  const departmentHours = grievance.departmentId?.defaultSlaHours || 72;
  const hoursAllocated = grievance.sla?.hoursAllocated || calculateSlaHours({
    defaultSlaHours: departmentHours,
    priority: grievance.priority,
  });

  const predictedDueAt = grievance.sla?.predictedDueAt
    ? new Date(grievance.sla.predictedDueAt)
    : new Date(createdAt.getTime() + hoursAllocated * 60 * 60 * 1000);

  const isResolved = ['resolved', 'closed'].includes(grievance.status);
  const resolvedAt = grievance.sla?.resolvedAt
    ? new Date(grievance.sla.resolvedAt)
    : isResolved
      ? new Date(grievance.updatedAt || now)
      : null;

  const nowMs = now.getTime();
  const dueMs = predictedDueAt.getTime();
  const elapsedHours = Math.max(0, Math.round((nowMs - createdAt.getTime()) / (1000 * 60 * 60)));
  const hoursRemaining = Math.round((dueMs - nowMs) / (1000 * 60 * 60));

  let status = 'on_track';
  let isOverdue = false;
  let riskScore = 0; // 0 to 100

  if (isResolved && resolvedAt) {
    if (resolvedAt.getTime() <= dueMs) {
      status = 'met';
      riskScore = 0;
    } else {
      status = 'breached';
      riskScore = 100;
    }
  } else {
    if (nowMs > dueMs) {
      status = 'breached';
      isOverdue = true;
      riskScore = 100;
    } else if (hoursRemaining <= 24) {
      status = 'at_risk';
      riskScore = Math.min(95, Math.max(60, Math.round(100 - (hoursRemaining / 24) * 40)));
    } else {
      status = 'on_track';
      const progressRatio = elapsedHours / (hoursAllocated || 72);
      riskScore = Math.min(50, Math.round(progressRatio * 50));
    }
  }

  return {
    hoursAllocated,
    predictedDueAt,
    resolvedAt,
    elapsedHours,
    hoursRemaining,
    isOverdue,
    status,
    riskScore,
  };
}

/**
 * Initializes or updates SLA state on a Grievance document before saving.
 */
export async function initializeGrievanceSla(grievance) {
  let defaultSlaHours = 72;
  if (grievance.departmentId) {
    const dept = await Department.findById(grievance.departmentId);
    if (dept?.defaultSlaHours) {
      defaultSlaHours = dept.defaultSlaHours;
    }
  }

  const hoursAllocated = calculateSlaHours({
    defaultSlaHours,
    priority: grievance.priority || 'medium',
  });

  const createdAt = grievance.createdAt || new Date();
  const predictedDueAt = new Date(createdAt.getTime() + hoursAllocated * 60 * 60 * 1000);

  grievance.sla = {
    hoursAllocated,
    predictedDueAt,
    status: 'on_track',
    resolvedAt: null,
    breachedAt: null,
  };

  return grievance;
}
