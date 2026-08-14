import { asyncHandler } from '../middleware/validate.js';
import * as grievanceService from '../services/grievance.service.js';

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
