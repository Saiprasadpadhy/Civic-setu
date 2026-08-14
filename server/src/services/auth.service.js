import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { signToken } from '../utils/jwt.js';

function sanitizeUser(user) {
  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  return safeUser;
}

function buildToken(user) {
  return signToken({
    userId: user._id.toString(),
    role: user.role,
    departmentId: user.departmentId?.toString() ?? null,
  });
}

export async function registerUser({ name, email, password, preferredLanguage, wardId }) {
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'citizen',
    preferredLanguage: preferredLanguage ?? 'en',
    wardId: wardId ?? null,
  });

  const token = buildToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await comparePassword(password, user.passwordHash);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = buildToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function getUserProfile(userId) {
  const user = await User.findById(userId).select('-passwordHash');

  if (!user || !user.isActive) {
    throw new AppError('User not found', 404);
  }

  return sanitizeUser(user);
}
