import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/validate.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, preferredLanguage, wardId } = req.body;

  const result = await authService.registerUser({
    name,
    email,
    password,
    preferredLanguage,
    wardId,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser({ email, password });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const adminOnly = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
  });
});
