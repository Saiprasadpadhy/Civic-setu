import { AppError } from '../middleware/errorHandler.js';
import { LANGUAGES } from '../constants/enums.js';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const SUPPORTED_LANGUAGES = LANGUAGES.filter((lang) => lang !== 'unknown');

function collectErrors(checks) {
  return checks.filter(Boolean);
}

export function validateRegister(req, _res, next) {
  const { name, email, password, preferredLanguage } = req.body ?? {};
  const errors = collectErrors([
    !name || typeof name !== 'string' || name.trim().length < 2
      ? 'Name must be at least 2 characters'
      : null,
    !email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())
      ? 'A valid email is required'
      : null,
    !password || typeof password !== 'string' || password.length < 8
      ? 'Password must be at least 8 characters'
      : null,
    preferredLanguage && !SUPPORTED_LANGUAGES.includes(preferredLanguage)
      ? 'Preferred language must be en, hi, or or'
      : null,
  ]);

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }

  next();
}

export function validateLogin(req, _res, next) {
  const { email, password } = req.body ?? {};
  const errors = collectErrors([
    !email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())
      ? 'A valid email is required'
      : null,
    !password || typeof password !== 'string' ? 'Password is required' : null,
  ]);

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }

  next();
}
