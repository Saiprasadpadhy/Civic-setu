import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';

export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export function assertValidObjectId(value, label = 'ID') {
  if (!isValidObjectId(value)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return value;
}

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '10', 10) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function parseSort(query, allowedFields, defaultField = 'createdAt') {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return { [sortBy]: sortOrder };
}

export function buildDateRangeFilter(fromDate, toDate) {
  if (!fromDate && !toDate) return undefined;

  const range = {};
  if (fromDate) {
    const from = new Date(fromDate);
    if (Number.isNaN(from.getTime())) {
      throw new AppError('Invalid fromDate', 400);
    }
    range.$gte = from;
  }
  if (toDate) {
    const to = new Date(toDate);
    if (Number.isNaN(to.getTime())) {
      throw new AppError('Invalid toDate', 400);
    }
    range.$lte = to;
  }
  return range;
}

export function paginatedResponse({ items, total, page, limit }) {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}
