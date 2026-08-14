export const STATUS_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['assigned', 'rejected'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  rejected: ['reopened'],
  reopened: ['under_review', 'assigned'],
};

export const OFFICER_ALLOWED_STATUSES = [
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'rejected',
  'reopened',
];

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGES_PER_GRIEVANCE = 10;

export const GRIEVANCE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'priority',
  'status',
  'ticketId',
];

export function canTransition(fromStatus, toStatus, { isAdmin = false } = {}) {
  if (fromStatus === toStatus) return true;
  if (isAdmin) return true;
  return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

export function normalizeStatus(status) {
  return typeof status === 'string' ? status.toLowerCase().trim() : status;
}
