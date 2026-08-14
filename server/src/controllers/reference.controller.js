import { asyncHandler } from '../middleware/validate.js';
import * as grievanceService from '../services/grievance.service.js';

export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await grievanceService.listDepartments();
  res.status(200).json({ success: true, data: { departments } });
});

export const listWards = asyncHandler(async (_req, res) => {
  const wards = await grievanceService.listWards();
  res.status(200).json({ success: true, data: { wards } });
});

export const getWard = asyncHandler(async (req, res) => {
  const ward = await grievanceService.getWardById(req.params.id);
  res.status(200).json({ success: true, data: { ward } });
});
