import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/validate.js';
import * as grievanceService from '../services/grievance.service.js';
import Grievance from '../models/Grievance.js';
import Ward from '../models/Ward.js';
import Department from '../models/Department.js';
import BudgetProject from '../models/BudgetProject.js';
import { computeGrievanceSla } from '../services/sla.service.js';
import { buildDateRangeFilter } from '../utils/query.js';

export const listGrievances = asyncHandler(async (req, res) => {
  const result = await grievanceService.listAdminGrievances(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getGrievance = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.getGrievanceById(req.params.id);

  res.status(200).json({
    success: true,
    data: { grievance },
  });
});

export const getTimeline = asyncHandler(async (req, res) => {
  const timeline = await grievanceService.getGrievanceTimeline(req.params.id);

  res.status(200).json({
    success: true,
    data: { timeline },
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const auditLogs = await grievanceService.getGrievanceAuditLogs(req.params.id);

  res.status(200).json({
    success: true,
    data: { auditLogs },
  });
});

export const assignOfficer = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.getGrievanceById(req.params.id);
  const updated = await grievanceService.assignOfficer({
    grievance,
    officerId: req.body.officerId,
    actor: req.user,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Officer assigned successfully',
    data: { grievance: updated },
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.getGrievanceById(req.params.id);
  const updated = await grievanceService.updateGrievanceStatus({
    grievance,
    toStatus: req.body.status,
    actor: req.user,
    note: req.body.note,
    req,
    allowAdminOverride: true,
  });

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: { grievance: updated },
  });
});

export const listOfficers = asyncHandler(async (req, res) => {
  const officers = await grievanceService.listOfficers(req.query.departmentId);

  res.status(200).json({
    success: true,
    data: { officers },
  });
});

/**
 * High-performance backend analytics aggregation.
 * Computes city KPIs, category/dept/ward breakdowns, SLA compliance, trends, spam, duplicates.
 */
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { fromDate, toDate, wardId, departmentId } = req.query;
  const matchFilter = {};

  const createdAtFilter = buildDateRangeFilter(fromDate, toDate);
  if (createdAtFilter) matchFilter.createdAt = createdAtFilter;
  if (wardId && mongoose.isValidObjectId(wardId)) matchFilter.wardId = new mongoose.Types.ObjectId(wardId);
  if (departmentId && mongoose.isValidObjectId(departmentId)) matchFilter.departmentId = new mongoose.Types.ObjectId(departmentId);

  const [
    kpiAgg,
    categoryAgg,
    departmentAgg,
    wardAgg,
    priorityAgg,
    trendsAgg,
    allDepartments,
    allWards,
    budgetStats,
  ] = await Promise.all([
    // KPI Aggregation
    Grievance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $not: [{ $in: ['$status', ['resolved', 'closed']] }] }, 1, 0] },
          },
          spam: {
            $sum: { $cond: [{ $eq: ['$spamResult.isSpam', true] }, 1, 0] },
          },
          duplicates: {
            $sum: { $cond: [{ $eq: ['$isDuplicate', true] }, 1, 0] },
          },
          totalResolutionMs: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['resolved', 'closed']] },
                    { $gt: ['$sla.resolvedAt', null] },
                  ],
                },
                { $subtract: ['$sla.resolvedAt', '$createdAt'] },
                0,
              ],
            },
          },
          resolvedWithTimestampCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['resolved', 'closed']] },
                    { $gt: ['$sla.resolvedAt', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // Category Breakdown
    Grievance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $ifNull: ['$category', 'other'] },
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $not: [{ $in: ['$status', ['resolved', 'closed']] }] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Department Breakdown
    Grievance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$departmentId',
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $not: [{ $in: ['$status', ['resolved', 'closed']] }] }, 1, 0] },
          },
          breachedCount: {
            $sum: { $cond: [{ $eq: ['$sla.status', 'breached'] }, 1, 0] },
          },
        },
      },
    ]),

    // Ward Breakdown
    Grievance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$wardId',
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $not: [{ $in: ['$status', ['resolved', 'closed']] }] }, 1, 0] },
          },
          criticalCount: {
            $sum: { $cond: [{ $in: ['$priority', ['high', 'critical']] }, 1, 0] },
          },
        },
      },
    ]),

    // Priority Breakdown
    Grievance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $ifNull: ['$priority', 'medium'] },
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
        },
      },
    ]),

    // Daily Complaint Trends (Last 14 days or filtered period)
    Grievance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Department.find({ isActive: true }).select('name code defaultSlaHours'),
    Ward.find({ isActive: true }).select('name code city population'),
    BudgetProject.aggregate([
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalProposedCost: { $sum: '$estimatedCost' },
          totalVotes: { $sum: '$voteCount' },
        },
      },
    ]),
  ]);

  const kpis = kpiAgg[0] || {
    total: 0,
    resolved: 0,
    pending: 0,
    spam: 0,
    duplicates: 0,
    totalResolutionMs: 0,
    resolvedWithTimestampCount: 0,
  };

  const total = kpis.total || 0;
  const resolved = kpis.resolved || 0;
  const pending = kpis.pending || 0;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  
  const avgResolutionHours = kpis.resolvedWithTimestampCount > 0
    ? Math.round((kpis.totalResolutionMs / kpis.resolvedWithTimestampCount) / (1000 * 60 * 60))
    : 24;

  // Enrich department breakdown
  const deptMap = new Map(allDepartments.map((d) => [d._id.toString(), d]));
  const byDepartment = allDepartments.map((dept) => {
    const found = departmentAgg.find((da) => da._id && da._id.toString() === dept._id.toString());
    const count = found?.count || 0;
    const resolvedCount = found?.resolvedCount || 0;
    const pendingCount = found?.pendingCount || 0;
    const breachedCount = found?.breachedCount || 0;
    const slaComplianceRate = count > 0 ? Math.round(((count - breachedCount) / count) * 100) : 100;

    return {
      departmentId: dept._id,
      name: dept.name,
      code: dept.code,
      defaultSlaHours: dept.defaultSlaHours,
      count,
      resolvedCount,
      pendingCount,
      slaComplianceRate,
    };
  });

  // Enrich ward breakdown
  const byWard = allWards.map((w) => {
    const found = wardAgg.find((wa) => wa._id && wa._id.toString() === w._id.toString());
    return {
      wardId: w._id,
      name: w.name,
      code: w.code,
      city: w.city,
      population: w.population || 25000,
      count: found?.count || 0,
      resolvedCount: found?.resolvedCount || 0,
      pendingCount: found?.pendingCount || 0,
      criticalCount: found?.criticalCount || 0,
    };
  });

  // Category chart formatting
  const byCategory = categoryAgg.map((c) => ({
    name: c._id.toUpperCase(),
    category: c._id,
    count: c.count,
    resolvedCount: c.resolvedCount,
    pendingCount: c.pendingCount,
  }));

  // Priority chart formatting
  const byPriority = priorityAgg.map((p) => ({
    priority: p._id,
    name: p._id.toUpperCase(),
    count: p.count,
    resolvedCount: p.resolvedCount,
  }));

  // Trends formatting
  const trends = trendsAgg.map((t) => ({
    date: t._id,
    count: t.count,
    resolved: t.resolved,
  }));

  // Calculate live SLA Compliance overview
  const now = new Date();
  const unclosedGrievances = await Grievance.find({
    status: { $nin: ['resolved', 'closed'] },
    ...matchFilter,
  }).select('createdAt sla priority departmentId');

  let onTrackCount = 0;
  let atRiskCount = 0;
  let breachedCount = 0;

  unclosedGrievances.forEach((g) => {
    const sla = computeGrievanceSla(g, now);
    if (sla.status === 'breached') breachedCount++;
    else if (sla.status === 'at_risk') atRiskCount++;
    else onTrackCount++;
  });

  const totalOpen = unclosedGrievances.length;
  const slaComplianceRate = totalOpen > 0
    ? Math.round(((onTrackCount + atRiskCount) / totalOpen) * 100)
    : 100;

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        total,
        resolved,
        pending,
        resolutionRate,
        avgResolutionHours,
        spamCount: kpis.spam || 0,
        duplicateCount: kpis.duplicates || 0,
      },
      slaCompliance: {
        onTrack: onTrackCount,
        atRisk: atRiskCount,
        breached: breachedCount,
        totalOpen,
        complianceRate: slaComplianceRate,
      },
      byCategory,
      byDepartment,
      byWard,
      byPriority,
      trends,
      publicWorksSummary: budgetStats[0] || {
        totalProjects: 0,
        totalProposedCost: 0,
        totalVotes: 0,
      },
    },
  });
});

/**
 * Backend spatial ward heatmap aggregation.
 * Returns aggregated ward density and point clusters without exposing private citizen data.
 */
export const getWardHeatmap = asyncHandler(async (req, res) => {
  const { category, priority, status, fromDate, toDate, wardId } = req.query;
  const filter = {};

  if (category) filter.category = category.trim();
  if (priority) filter.priority = priority.trim();
  if (status) filter.status = status.trim();
  if (wardId && mongoose.isValidObjectId(wardId)) filter.wardId = new mongoose.Types.ObjectId(wardId);

  const createdAt = buildDateRangeFilter(fromDate, toDate);
  if (createdAt) filter.createdAt = createdAt;

  const [wards, grievancesAgg, densityPoints] = await Promise.all([
    Ward.find({ isActive: true }).select('name code city center population boundaries'),
    // Aggregation by ward
    Grievance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$wardId',
          totalCount: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $in: ['$priority', ['high', 'critical']] }, 1, 0] },
          },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $not: [{ $in: ['$status', ['resolved', 'closed']] }] }, 1, 0] },
          },
          categories: { $push: '$category' },
        },
      },
    ]),
    // Clustered density points (Privacy preserved: zero personal info)
    Grievance.aggregate([
      { $match: filter },
      {
        $project: {
          latitude: { $round: ['$latitude', 4] },
          longitude: { $round: ['$longitude', 4] },
          category: { $ifNull: ['$category', 'general'] },
          priority: { $ifNull: ['$priority', 'medium'] },
          status: '$status',
          ticketId: '$ticketId',
          wardId: '$wardId',
          createdAt: '$createdAt',
        },
      },
      {
        $group: {
          _id: {
            lat: '$latitude',
            lng: '$longitude',
            category: '$category',
            priority: '$priority',
          },
          count: { $sum: 1 },
          status: { $first: '$status' },
          sampleTicketId: { $first: '$ticketId' },
          wardId: { $first: '$wardId' },
          latestCreatedAt: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          _id: 0,
          latitude: '$_id.lat',
          longitude: '$_id.lng',
          category: '$_id.category',
          priority: '$_id.priority',
          count: '$count',
          intensity: {
            $cond: [
              { $in: ['$_id.priority', ['high', 'critical']] },
              { $multiply: ['$count', 2] },
              '$count',
            ],
          },
          status: '$status',
          ticketId: '$sampleTicketId',
          wardId: '$wardId',
          createdAt: '$latestCreatedAt',
        },
      },
    ]),
  ]);

  // Merge aggregated ward stats
  const wardDensity = wards.map((w) => {
    const agg = grievancesAgg.find((g) => g._id && g._id.toString() === w._id.toString());
    const totalCount = agg?.totalCount || 0;
    const criticalCount = agg?.criticalCount || 0;
    const resolvedCount = agg?.resolvedCount || 0;
    const pendingCount = agg?.pendingCount || 0;

    return {
      _id: w._id,
      name: w.name,
      code: w.code,
      city: w.city,
      center: w.center?.coordinates ? [w.center.coordinates[1], w.center.coordinates[0]] : [20.2961, 85.8245],
      population: w.population || 25000,
      totalCount,
      criticalCount,
      resolvedCount,
      pendingCount,
      densityScore: Math.min(100, totalCount * 10 + criticalCount * 15),
    };
  });

  res.status(200).json({
    success: true,
    data: {
      wards: wardDensity,
      densityPoints,
      totalHotspots: densityPoints.length,
      totalGrievancesInView: densityPoints.reduce((s, p) => s + p.count, 0),
    },
  });
});

/**
 * Backend SLA monitoring endpoint.
 * Returns real-time SLA metrics, countdown deadlines, and risk rankings.
 */
export const getSLAMonitoring = asyncHandler(async (req, res) => {
  const { departmentId, priority, status } = req.query;
  const filter = {};

  if (departmentId && mongoose.isValidObjectId(departmentId)) {
    filter.departmentId = new mongoose.Types.ObjectId(departmentId);
  }
  if (priority) filter.priority = priority;
  if (status) filter.status = status;
  else filter.status = { $nin: ['closed'] };

  const grievances = await Grievance.find(filter)
    .populate('departmentId', 'name code defaultSlaHours')
    .populate('wardId', 'name code city')
    .populate('assignedOfficerId', 'name email role')
    .sort({ 'sla.predictedDueAt': 1, createdAt: -1 });

  const now = new Date();
  const enriched = grievances.map((g) => {
    const sla = computeGrievanceSla(g, now);
    return {
      _id: g._id,
      ticketId: g.ticketId,
      title: g.title,
      category: g.category,
      priority: g.priority,
      priorityScore: g.priorityScore,
      status: g.status,
      ward: g.wardId,
      department: g.departmentId,
      assignedOfficer: g.assignedOfficerId,
      createdAt: g.createdAt,
      hoursAllocated: sla.hoursAllocated,
      predictedDueAt: sla.predictedDueAt,
      resolvedAt: sla.resolvedAt,
      elapsedHours: sla.elapsedHours,
      hoursRemaining: sla.hoursRemaining,
      isOverdue: sla.isOverdue,
      slaStatus: sla.status,
      riskScore: sla.riskScore,
    };
  });

  const breached = enriched.filter((g) => g.slaStatus === 'breached');
  const atRisk = enriched.filter((g) => g.slaStatus === 'at_risk');
  const onTrack = enriched.filter((g) => g.slaStatus === 'on_track');
  const met = enriched.filter((g) => g.slaStatus === 'met');

  // Sorted by urgency: breached first (highest risk), then at risk, then on track
  enriched.sort((a, b) => b.riskScore - a.riskScore || a.hoursRemaining - b.hoursRemaining);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        total: enriched.length,
        breachedCount: breached.length,
        atRiskCount: atRisk.length,
        onTrackCount: onTrack.length,
        metCount: met.length,
        complianceRate: enriched.length > 0
          ? Math.round(((onTrack.length + met.length) / enriched.length) * 100)
          : 100,
      },
      items: enriched,
    },
  });
});
