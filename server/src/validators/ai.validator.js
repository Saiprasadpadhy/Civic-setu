import { AppError } from '../middleware/errorHandler.js';
import { assertValidObjectId } from '../utils/query.js';

export function validateAiPreview(req, _res, next) {
  const { title, description, wardId, latitude, longitude, imageUrl, mimeType } = req.body ?? {};

  const errors = [];
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (!wardId) errors.push('wardId is required');
  if (latitude == null || longitude == null) errors.push('latitude and longitude are required');

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }

  try {
    assertValidObjectId(wardId, 'wardId');
    req.body = {
      title: title.trim(),
      description: description.trim(),
      wardId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      imageUrl,
      mimeType,
    };
    next();
  } catch (error) {
    next(error);
  }
}
