import { AppError } from '../middleware/errorHandler.js';
import { GRIEVANCE_STATUSES, PRIORITIES, RESOLUTION_EVIDENCE_TYPES } from '../constants/enums.js';
import { IMAGE_MIME_TYPES, MAX_IMAGES_PER_GRIEVANCE, normalizeStatus } from '../constants/workflow.js';
import { assertValidObjectId } from '../utils/query.js';

function collectErrors(checks) {
  return checks.filter(Boolean);
}

function validateImages(images) {
  if (images == null) return [];
  if (!Array.isArray(images)) {
    throw new AppError('Images must be an array', 400);
  }
  if (images.length > MAX_IMAGES_PER_GRIEVANCE) {
    throw new AppError(`Cannot upload more than ${MAX_IMAGES_PER_GRIEVANCE} images`, 400);
  }

  return images.map((image, index) => {
    if (!image?.url || typeof image.url !== 'string') {
      throw new AppError(`Image at index ${index} requires a valid url`, 400);
    }
    if (image.mimeType && !IMAGE_MIME_TYPES.includes(image.mimeType)) {
      throw new AppError(`Unsupported image mime type at index ${index}`, 400);
    }
    return {
      url: image.url.trim(),
      mimeType: image.mimeType?.trim(),
      caption: image.caption?.trim(),
    };
  });
}

export function validateCreateGrievance(req, _res, next) {
  const { title, description, category, wardId, latitude, longitude, location, images } =
    req.body ?? {};

  const errors = collectErrors([
    !title || typeof title !== 'string' || title.trim().length < 3
      ? 'Title must be at least 3 characters'
      : null,
    !description || typeof description !== 'string' || description.trim().length < 10
      ? 'Description must be at least 10 characters'
      : null,
    !category || typeof category !== 'string' || !category.trim()
      ? 'Category is required'
      : null,
    !wardId ? 'Ward is required' : null,
    latitude == null || Number.isNaN(Number(latitude)) ? 'Valid latitude is required' : null,
    longitude == null || Number.isNaN(Number(longitude)) ? 'Valid longitude is required' : null,
    Number(latitude) < -90 || Number(latitude) > 90 ? 'Latitude must be between -90 and 90' : null,
    Number(longitude) < -180 || Number(longitude) > 180
      ? 'Longitude must be between -180 and 180'
      : null,
  ]);

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }

  try {
    assertValidObjectId(wardId, 'wardId');
    req.body = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      wardId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: typeof location === 'string' ? location : location?.addressText,
      images: validateImages(images),
    };
  } catch (error) {
    return next(error);
  }

  next();
}

export function validateObjectIdParam(paramName = 'id') {
  return (req, _res, next) => {
    try {
      assertValidObjectId(req.params[paramName], paramName);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateStatusUpdate(req, _res, next) {
  const { status, note } = req.body ?? {};
  const normalized = normalizeStatus(status);

  if (!normalized || !GRIEVANCE_STATUSES.includes(normalized)) {
    return next(new AppError('Valid status is required', 400));
  }

  req.body = {
    status: normalized,
    note: note?.trim(),
  };
  next();
}

export function validateRemark(req, _res, next) {
  const { note } = req.body ?? {};
  if (!note || typeof note !== 'string' || note.trim().length < 2) {
    return next(new AppError('Remark must be at least 2 characters', 400));
  }
  req.body.note = note.trim();
  next();
}

export function validateResolve(req, _res, next) {
  const { resolutionSummary } = req.body ?? {};
  if (!resolutionSummary || typeof resolutionSummary !== 'string' || resolutionSummary.trim().length < 5) {
    return next(new AppError('Resolution summary must be at least 5 characters', 400));
  }
  req.body.resolutionSummary = resolutionSummary.trim();
  next();
}

export function validateAssignOfficer(req, _res, next) {
  const { officerId } = req.body ?? {};
  if (!officerId) {
    return next(new AppError('officerId is required', 400));
  }
  try {
    assertValidObjectId(officerId, 'officerId');
    next();
  } catch (error) {
    next(error);
  }
}

export function validateResolutionEvidence(req, _res, next) {
  const { url, mimeType, evidenceType, caption, notes } = req.body ?? {};

  const errors = collectErrors([
    !url || typeof url !== 'string' ? 'Evidence url is required' : null,
    mimeType && !IMAGE_MIME_TYPES.includes(mimeType) && !mimeType.startsWith('application/pdf')
      ? 'Unsupported evidence mime type'
      : null,
    evidenceType && !RESOLUTION_EVIDENCE_TYPES.includes(evidenceType)
      ? 'Invalid evidence type'
      : null,
  ]);

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }

  req.body = {
    url: url.trim(),
    mimeType: mimeType?.trim(),
    evidenceType: evidenceType ?? 'after',
    caption: caption?.trim(),
    notes: notes?.trim(),
  };
  next();
}

export function validateListFilters(req, _res, next) {
  if (req.query.status && !GRIEVANCE_STATUSES.includes(normalizeStatus(req.query.status))) {
    return next(new AppError('Invalid status filter', 400));
  }
  if (req.query.priority && !PRIORITIES.includes(req.query.priority)) {
    return next(new AppError('Invalid priority filter', 400));
  }
  next();
}
