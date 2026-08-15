import Grievance from '../models/Grievance.js';
import GrievanceStatusHistory from '../models/GrievanceStatusHistory.js';
import ResolutionEvidence from '../models/ResolutionEvidence.js';
import AuditLog from '../models/AuditLog.js';
import Department from '../models/Department.js';
import Ward from '../models/Ward.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { writeAuditLog } from './audit.service.js';
import { runIntelligencePipeline } from './aiIntelligence.service.js';
import {
  assertValidObjectId,
  buildDateRangeFilter,
  paginatedResponse,
  parsePagination,
  parseSort,
} from '../utils/query.js';
import {
  canTransition,
  GRIEVANCE_SORT_FIELDS,
  normalizeStatus,
} from '../constants/workflow.js';
import { GRIEVANCE_STATUSES, PRIORITIES } from '../constants/enums.js';
import { calculateSlaHours, computeGrievanceSla } from './sla.service.js';

const grievancePopulate = [
  { path: 'wardId', select: 'name code city' },
  { path: 'departmentId', select: 'name code' },
  { path: 'citizenId', select: 'name email role' },
  { path: 'assignedOfficerId', select: 'name email role departmentId' },
];

function buildFilter(query) {
  const filter = {};

  if (query.status) {
    const status = normalizeStatus(query.status);
    if (!GRIEVANCE_STATUSES.includes(status)) {
      throw new AppError('Invalid status filter', 400);
    }
    filter.status = status;
  }

  if (query.category) filter.category = query.category.trim();
  if (query.departmentId) {
    assertValidObjectId(query.departmentId, 'departmentId');
    filter.departmentId = query.departmentId;
  }
  if (query.wardId) {
    assertValidObjectId(query.wardId, 'wardId');
    filter.wardId = query.wardId;
  }
  if (query.priority) {
    if (!PRIORITIES.includes(query.priority)) {
      throw new AppError('Invalid priority filter', 400);
    }
    filter.priority = query.priority;
  }

  const createdAt = buildDateRangeFilter(query.fromDate, query.toDate);
  if (createdAt) filter.createdAt = createdAt;

  return filter;
}

async function resolveDepartmentByCategory(category) {
  if (!category) return null;
  const department = await Department.findOne({
    categories: category.trim(),
    isActive: true,
  });
  return department?._id ?? null;
}

async function recordStatusHistory({
  grievanceId,
  fromStatus,
  toStatus,
  actorId,
  actorRole,
  note,
  metadata = {},
}) {
  return GrievanceStatusHistory.create({
    grievanceId,
    fromStatus,
    toStatus,
    actorId,
    actorRole,
    note,
    metadata,
  });
}

export async function createGrievance(citizenId, payload, req) {
  assertValidObjectId(payload.wardId, 'wardId');

  const ward = await Ward.findById(payload.wardId);
  if (!ward || !ward.isActive) {
    throw new AppError('Invalid or inactive ward', 400);
  }

  const departmentId = await resolveDepartmentByCategory(payload.category);

  const grievance = await Grievance.create({
    title: payload.title.trim(),
    description: payload.description.trim(),
    category: payload.category?.trim(),
    wardId: payload.wardId,
    departmentId,
    citizenId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    location: {
      type: 'Point',
      coordinates: [payload.longitude, payload.latitude],
      addressText: payload.location?.trim(),
    },
    images: payload.images ?? [],
    status: 'submitted',
    aiStatus: 'pending',
    titleNormalized: payload.title.trim(),
    descriptionNormalized: payload.description.trim(),
    sla: {
      hoursAllocated: 72,
      predictedDueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      status: 'on_track',
      resolvedAt: null,
    },
  });

  await recordStatusHistory({
    grievanceId: grievance._id,
    fromStatus: undefined,
    toStatus: 'submitted',
    actorId: citizenId,
    actorRole: 'citizen',
    note: 'Grievance submitted',
  });

  await writeAuditLog({
    entityType: 'grievance',
    entityId: grievance._id,
    action: 'grievance_created',
    actorId: citizenId,
    actorRole: 'citizen',
    after: {
      ticketId: grievance.ticketId,
      status: grievance.status,
      category: grievance.category,
      wardId: grievance.wardId,
    },
    req,
  });

  try {
    await runIntelligencePipeline(grievance, { req });
  } catch (error) {
    grievance.aiStatus = 'failed';
    grievance.aiError = error.message;
    await grievance.save();
  }

  return getGrievanceById(grievance._id);
}

export async function getGrievanceById(grievanceId) {
  assertValidObjectId(grievanceId, 'grievance id');
  const grievance = await Grievance.findById(grievanceId).populate(grievancePopulate);
  if (!grievance) throw new AppError('Grievance not found', 404);
  return grievance;
}

export async function assertGrievanceAccess(grievanceId, user) {
  const grievance = await getGrievanceById(grievanceId);

  if (user.role === 'admin') return grievance;

  if (user.role === 'citizen') {
    if (grievance.citizenId._id.toString() !== user.userId) {
      throw new AppError('You do not have permission to access this grievance', 403);
    }
    return grievance;
  }

  if (user.role === 'officer') {
    const isAssigned = grievance.assignedOfficerId?._id?.toString() === user.userId;
    const sameDepartment =
      grievance.departmentId?._id?.toString() === user.departmentId ||
      grievance.departmentId?.toString?.() === user.departmentId;

    if (isAssigned || sameDepartment) return grievance;
    throw new AppError('You do not have permission to access this grievance', 403);
  }

  throw new AppError('You do not have permission to access this grievance', 403);
}

export async function listCitizenGrievances(citizenId, query) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, GRIEVANCE_SORT_FIELDS);
  const filter = { citizenId, ...buildFilter(query) };

  const [items, total] = await Promise.all([
    Grievance.find(filter).sort(sort).skip(skip).limit(limit).populate(grievancePopulate),
    Grievance.countDocuments(filter),
  ]);

  return paginatedResponse({ items, total, page, limit });
}

export async function listOfficerGrievances(user, query) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, GRIEVANCE_SORT_FIELDS);
  const filter = buildFilter(query);

  const scope = query.scope === 'department' ? 'department' : 'assigned';

  if (scope === 'assigned') {
    filter.assignedOfficerId = user.userId;
  } else {
    if (!user.departmentId) {
      throw new AppError('Officer is not linked to a department', 400);
    }
    filter.departmentId = user.departmentId;
  }

  const [items, total] = await Promise.all([
    Grievance.find(filter).sort(sort).skip(skip).limit(limit).populate(grievancePopulate),
    Grievance.countDocuments(filter),
  ]);

  return paginatedResponse({ items, total, page, limit });
}

export async function listAdminGrievances(query) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, GRIEVANCE_SORT_FIELDS);
  const filter = buildFilter(query);

  if (query.assignedOfficerId) {
    assertValidObjectId(query.assignedOfficerId, 'assignedOfficerId');
    filter.assignedOfficerId = query.assignedOfficerId;
  }

  if (query.citizenId) {
    assertValidObjectId(query.citizenId, 'citizenId');
    filter.citizenId = query.citizenId;
  }

  const [items, total] = await Promise.all([
    Grievance.find(filter).sort(sort).skip(skip).limit(limit).populate(grievancePopulate),
    Grievance.countDocuments(filter),
  ]);

  return paginatedResponse({ items, total, page, limit });
}

export async function getGrievanceTimeline(grievanceId) {
  assertValidObjectId(grievanceId, 'grievance id');
  return GrievanceStatusHistory.find({ grievanceId })
    .sort({ createdAt: 1 })
    .populate('actorId', 'name email role');
}

export async function getResolutionEvidence(grievanceId) {
  assertValidObjectId(grievanceId, 'grievance id');
  return ResolutionEvidence.find({ grievanceId })
    .sort({ createdAt: -1 })
    .populate('uploadedById', 'name email role');
}

export async function getGrievanceAuditLogs(grievanceId) {
  assertValidObjectId(grievanceId, 'grievance id');
  return AuditLog.find({ entityType: 'grievance', entityId: grievanceId })
    .sort({ createdAt: -1 })
    .populate('actorId', 'name email role');
}

export async function updateGrievanceStatus({
  grievance,
  toStatus,
  actor,
  note,
  req,
  allowAdminOverride = false,
}) {
  const normalizedToStatus = normalizeStatus(toStatus);
  if (!GRIEVANCE_STATUSES.includes(normalizedToStatus)) {
    throw new AppError('Invalid status', 400);
  }

  const fromStatus = grievance.status;
  const isAdmin = actor.role === 'admin';
  const transitionAllowed = canTransition(fromStatus, normalizedToStatus);

  if (!isAdmin && !transitionAllowed) {
    throw new AppError(`Invalid status transition from ${fromStatus} to ${normalizedToStatus}`, 400);
  }

  grievance.status = normalizedToStatus;

  if (normalizedToStatus === 'resolved') {
    const resolvedAt = new Date();
    const slaCalc = computeGrievanceSla(
      {
        ...grievance.toObject(),
        createdAt: grievance.createdAt,
        status: 'resolved',
        sla: { ...grievance.sla, resolvedAt },
      },
      resolvedAt
    );

    grievance.sla = {
      ...grievance.sla,
      resolvedAt,
      status: slaCalc.status,
    };
  }

  await grievance.save();

  await recordStatusHistory({
    grievanceId: grievance._id,
    fromStatus,
    toStatus: normalizedToStatus,
    actorId: actor.userId,
    actorRole: actor.role,
    note,
  });

  await writeAuditLog({
    entityType: 'grievance',
    entityId: grievance._id,
    action: isAdmin && !transitionAllowed ? 'status_override' : 'status_changed',
    actorId: actor.userId,
    actorRole: actor.role,
    before: { status: fromStatus },
    after: { status: normalizedToStatus },
    metadata: { note },
    req,
  });

  return grievance.populate(grievancePopulate);
}

export async function addGrievanceRemark({ grievance, actor, note, req }) {
  await recordStatusHistory({
    grievanceId: grievance._id,
    fromStatus: grievance.status,
    toStatus: grievance.status,
    actorId: actor.userId,
    actorRole: actor.role,
    note,
    metadata: { type: 'remark' },
  });

  await writeAuditLog({
    entityType: 'grievance',
    entityId: grievance._id,
    action: 'remark_added',
    actorId: actor.userId,
    actorRole: actor.role,
    metadata: { note },
    req,
  });

  return note;
}

export async function resolveGrievance({ grievance, actor, resolutionSummary, req }) {
  if (!resolutionSummary?.trim()) {
    throw new AppError('Resolution summary is required', 400);
  }

  grievance.resolutionSummary = resolutionSummary.trim();

  return updateGrievanceStatus({
    grievance,
    toStatus: 'resolved',
    actor,
    note: resolutionSummary.trim(),
    req,
  });
}

export async function assignOfficer({ grievance, officerId, actor, req }) {
  assertValidObjectId(officerId, 'officerId');

  const officer = await User.findById(officerId);
  if (!officer || officer.role !== 'officer' || !officer.isActive) {
    throw new AppError('Invalid officer', 400);
  }

  const previousOfficerId = grievance.assignedOfficerId?.toString() ?? null;
  grievance.assignedOfficerId = officer._id;

  if (['submitted', 'under_review', 'reopened'].includes(grievance.status)) {
    const fromStatus = grievance.status;
    grievance.status = 'assigned';

    await recordStatusHistory({
      grievanceId: grievance._id,
      fromStatus,
      toStatus: 'assigned',
      actorId: actor.userId,
      actorRole: actor.role,
      note: `Assigned to officer ${officer.name}`,
    });
  }

  await grievance.save();

  await writeAuditLog({
    entityType: 'grievance',
    entityId: grievance._id,
    action: previousOfficerId ? 'assignment_changed' : 'officer_assigned',
    actorId: actor.userId,
    actorRole: actor.role,
    before: { assignedOfficerId: previousOfficerId },
    after: { assignedOfficerId: officer._id.toString() },
    req,
  });

  return grievance.populate(grievancePopulate);
}

export async function claimGrievance({ grievance, actor, req }) {
  return assignOfficer({
    grievance,
    officerId: actor.userId,
    actor,
    req,
  });
}

export async function addResolutionEvidence({ grievance, actor, payload, req }) {
  const evidence = await ResolutionEvidence.create({
    grievanceId: grievance._id,
    uploadedById: actor.userId,
    evidenceType: payload.evidenceType ?? 'after',
    url: payload.url.trim(),
    mimeType: payload.mimeType,
    caption: payload.caption,
    notes: payload.notes,
  });

  await writeAuditLog({
    entityType: 'resolution_evidence',
    entityId: evidence._id,
    action: 'resolution_evidence_uploaded',
    actorId: actor.userId,
    actorRole: actor.role,
    after: {
      grievanceId: grievance._id.toString(),
      evidenceType: evidence.evidenceType,
      url: evidence.url,
    },
    metadata: { grievanceId: grievance._id.toString() },
    req,
  });

  return evidence.populate('uploadedById', 'name email role');
}

export async function closeGrievance({ grievance, actor, req }) {
  if (grievance.status !== 'resolved') {
    throw new AppError('Only resolved grievances can be closed by the citizen', 400);
  }

  return updateGrievanceStatus({
    grievance,
    toStatus: 'closed',
    actor,
    note: 'Closed by citizen after reviewing resolution',
    req,
  });
}

export async function listDepartments() {
  return Department.find({ isActive: true }).sort({ name: 1 });
}

export async function listWards() {
  return Ward.find({ isActive: true }).sort({ city: 1, name: 1 });
}

export async function getWardById(wardId) {
  assertValidObjectId(wardId, 'ward id');
  const ward = await Ward.findById(wardId);
  if (!ward || !ward.isActive) throw new AppError('Ward not found', 404);
  return ward;
}

export async function listOfficers(departmentId) {
  const filter = { role: 'officer', isActive: true };
  if (departmentId) {
    assertValidObjectId(departmentId, 'departmentId');
    filter.departmentId = departmentId;
  }
  return User.find(filter).select('name email departmentId role').sort({ name: 1 });
}
