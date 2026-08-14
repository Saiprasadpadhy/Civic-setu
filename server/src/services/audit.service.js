import AuditLog from '../models/AuditLog.js';

export async function writeAuditLog({
  entityType,
  entityId,
  action,
  actorId,
  actorRole,
  before = null,
  after = null,
  metadata = {},
  req = null,
}) {
  return AuditLog.create({
    entityType,
    entityId,
    action,
    actorId,
    actorRole,
    before,
    after,
    metadata,
    userAgent: req?.headers?.['user-agent'] ?? undefined,
  });
}
