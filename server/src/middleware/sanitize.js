/**
 * NoSQL Injection and basic input sanitization middleware.
 * Recursively cleans keys starting with '$' or containing '.' from req.body, req.query, and req.params.
 */
function cleanNoSqlInjection(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanNoSqlInjection);
  }

  const sanitized = {};
  for (const key of Object.keys(obj)) {
    // Strip keys starting with '$' (like $gt, $where, $ne) or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = cleanNoSqlInjection(value);
    } else if (typeof value === 'string') {
      sanitized[key] = value;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function sanitizeInputs(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanNoSqlInjection(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = cleanNoSqlInjection(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = cleanNoSqlInjection(req.params);
  }
  next();
}
