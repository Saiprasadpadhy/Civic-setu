import { asyncHandler } from '../middleware/validate.js';
import * as grievanceService from '../services/grievance.service.js';

export const createGrievance = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.createGrievance(req.user.userId, req.body, req);

  res.status(201).json({
    success: true,
    message: 'Grievance submitted successfully',
    data: { grievance },
  });
});

export const listMyGrievances = asyncHandler(async (req, res) => {
  const result = await grievanceService.listCitizenGrievances(req.user.userId, req.query);

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

export const getTimeline = asyncHandler(async (req, res) => {
  await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const timeline = await grievanceService.getGrievanceTimeline(req.params.id);

  res.status(200).json({
    success: true,
    data: { timeline },
  });
});

export const getEvidence = asyncHandler(async (req, res) => {
  await grievanceService.assertGrievanceAccess(req.params.id, req.user);
  const evidence = await grievanceService.getResolutionEvidence(req.params.id);

  res.status(200).json({
    success: true,
    data: { evidence },
  });
});

export const closeGrievance = asyncHandler(async (req, res) => {
  const grievance = await grievanceService.assertGrievanceAccess(req.params.id, req.user);

  if (req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'Only citizens can close their own grievances from this endpoint',
    });
  }

  const updated = await grievanceService.closeGrievance({
    grievance,
    actor: req.user,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Grievance closed successfully',
    data: { grievance: updated },
  });
});
