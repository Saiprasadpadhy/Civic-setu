import { AppError } from './errorHandler.js';

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateBody(rules) {
  return (req, _res, next) => {
    const errors = [];

    for (const rule of rules) {
      const error = rule(req.body);
      if (error) errors.push(error);
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join('. '), 400));
    }

    next();
  };
}
