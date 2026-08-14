import Grievance from '../models/Grievance.js';
import { combineSimilarity } from '../utils/textSimilarity.js';

const DUPLICATE_WINDOW_DAYS = 14;
const GEO_RADIUS_METERS = 300;

function buildExplanation({ textScore, sameCategory, sameWard, distanceMeters }) {
  const parts = [`Text similarity ${Math.round(textScore * 100)}%`];
  if (sameCategory) parts.push('same category');
  if (sameWard) parts.push('same ward');
  if (distanceMeters != null) parts.push(`within ${Math.round(distanceMeters)}m`);
  return parts.join(', ');
}

/**
 * Detect likely duplicates — does NOT auto-merge complaints.
 */
export async function detectDuplicates({
  grievanceId = null,
  title,
  description,
  titleNormalized,
  descriptionNormalized,
  category,
  wardId,
  longitude,
  latitude,
}) {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await Grievance.find({
    _id: grievanceId ? { $ne: grievanceId } : { $exists: true },
    wardId,
    createdAt: { $gte: since },
    status: { $nin: ['closed', 'rejected'] },
  })
    .select('title description titleNormalized descriptionNormalized category wardId location ticketId status createdAt')
    .limit(100)
    .lean();

  const sourceTitle = titleNormalized || title;
  const sourceDescription = descriptionNormalized || description;

  const matches = [];

  for (const candidate of candidates) {
    const textScore = combineSimilarity(
      sourceTitle,
      sourceDescription,
      candidate.titleNormalized || candidate.title,
      candidate.descriptionNormalized || candidate.description
    );

    let geoScore = 0;
    let distanceMeters = null;

    if (
      longitude != null &&
      latitude != null &&
      candidate.location?.coordinates?.length === 2
    ) {
      const [cLng, cLat] = candidate.location.coordinates;
      const dLat = ((cLat - latitude) * Math.PI) / 180;
      const dLng = ((cLng - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((cLat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      distanceMeters = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distanceMeters <= GEO_RADIUS_METERS) {
        geoScore = 1 - distanceMeters / GEO_RADIUS_METERS;
      }
    }

    const sameCategory = category && candidate.category === category;
    const categoryBoost = sameCategory ? 0.1 : 0;

    const similarity = Math.min(
      1,
      Number((textScore * 0.75 + geoScore * 0.15 + categoryBoost).toFixed(2))
    );

    if (similarity >= 0.55 || (textScore >= 0.8 && sameCategory)) {
      matches.push({
        grievanceId: candidate._id,
        ticketId: candidate.ticketId,
        status: candidate.status,
        confidence: similarity,
        matchReason: buildExplanation({
          textScore,
          sameCategory,
          sameWard: true,
          distanceMeters,
        }),
        textScore,
        geoScore,
      });
    }
  }

  matches.sort((a, b) => b.confidence - a.confidence);

  return {
    possibleDuplicates: matches.slice(0, 5),
    highestScore: matches[0]?.confidence ?? 0,
    explanation:
      matches.length > 0
        ? `Found ${matches.length} possible duplicate(s) based on text, category, ward, and proximity.`
        : 'No likely duplicates found.',
  };
}
