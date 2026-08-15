export const USER_ROLES = ['citizen', 'officer', 'admin'];

export const LANGUAGES = ['en', 'hi', 'or', 'unknown'];

export const GRIEVANCE_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'rejected',
  'reopened',
  'duplicate',
];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

export const SLA_STATUSES = ['on_track', 'at_risk', 'breached', 'met'];

export const BUDGET_PROJECT_STATUSES = [
  'proposed',
  'voting_open',
  'voting_closed',
  'approved',
  'funded',
  'completed',
  'rejected',
  'cancelled',
];

export const RESOLUTION_EVIDENCE_TYPES = ['before', 'after', 'document', 'other'];

export const AUDIT_ENTITY_TYPES = [
  'user',
  'grievance',
  'department',
  'ward',
  'budget_project',
  'resolution_evidence',
];

export const AI_STATUSES = ['pending', 'processing', 'completed', 'failed'];

export const SPAM_DECISION_SOURCES = ['rules', 'ai', 'admin', 'auto'];
