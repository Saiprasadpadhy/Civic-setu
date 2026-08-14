import Grievance from '../models/Grievance.js';

const MEANINGLESS_PATTERNS = [/^(test|asdf|qwerty|xxx+|\.+|hello)$/i, /^(.)\1{4,}$/];

function isMeaningless(text = '') {
  const trimmed = text.trim();
  if (trimmed.length < 8) return true;
  return MEANINGLESS_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Deterministic spam detection — flags suspicious patterns, never bans users.
 */
export async function detectSpam({ citizenId, title, description }) {
  const reasons = [];
  let score = 0;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await Grievance.countDocuments({
    citizenId,
    createdAt: { $gte: oneHourAgo },
  });

  if (recentCount >= 5) {
    score += 0.35;
    reasons.push('Excessive submission frequency in the last hour');
  } else if (recentCount >= 3) {
    score += 0.15;
    reasons.push('High submission frequency in the last hour');
  }

  const normalizedTitle = title.trim().toLowerCase();
  const duplicateText = await Grievance.findOne({
    citizenId,
    title: new RegExp(`^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    createdAt: { $gte: oneHourAgo },
  });

  if (duplicateText) {
    score += 0.4;
    reasons.push('Repeated submission with identical title');
  }

  if (isMeaningless(title) || isMeaningless(description)) {
    score += 0.35;
    reasons.push('Content appears meaningless or too short');
  }

  if (title.trim().length > 0 && title.trim() === description.trim()) {
    score += 0.2;
    reasons.push('Title and description are identical');
  }

  score = Math.min(1, Math.max(0, Number(score.toFixed(2))));

  return {
    score,
    isSpam: score >= 0.7,
    reasons,
    decidedBy: 'rules',
  };
}
