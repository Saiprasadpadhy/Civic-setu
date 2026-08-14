import { asyncHandler } from '../middleware/validate.js';
import * as grievanceService from '../services/grievance.service.js';

export const listGrievances = asyncHandler(async (req, res) => {
  const result = await grievanceService.listOfficerGrievances(req.user, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getGrievance = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.assertGrievanceAccess(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: { grievance },
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const updated = await grievanceService.updateGrievanceStatus({
    grievance,
    toStatus: req.body.status,
    actor: req.user,
    note: req.body.note,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: { grievance: updated },
  });
});

export const addRemark = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const note = await grievanceService.addGrievanceRemark({
    grievance,
    actor: req.user,
    note: req.body.note,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Remark added successfully',
    data: { note },
  });
});

export const resolveGrievance = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const updated = await grievanceService.resolveGrievance({
    grievance,
    actor: req.user,
    resolutionSummary: req.body.resolutionSummary,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Grievance resolved successfully',
    data: { grievance: updated },
  });
});

export const uploadEvidence = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const evidence = await grievanceService.addResolutionEvidence({
    grievance,
    actor: req.user,
    payload: req.body,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Resolution evidence uploaded successfully',
    data: { evidence },
  });
});
