import { AppError } from './errorHandler.js';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user || !user.isActive) {
      throw new AppError('Invalid or expired token', 401);
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      departmentId: user.departmentId?.toString() ?? null,
    };
    req.currentUser = user;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Invalid or expired token', 401));
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }

    next();
  };
}
