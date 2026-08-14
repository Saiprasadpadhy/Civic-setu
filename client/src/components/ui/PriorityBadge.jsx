import { PRIORITY_CONFIG } from '../../constants';

export function PriorityBadge({ priority, score, className = '' }) {
  const normalized = priority?.toLowerCase() || 'medium';
  const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${config.color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {config.label}
      {typeof score === 'number' && (
        <span className="ml-0.5 px-1 py-0.2 bg-black/20 rounded text-[10px] lowercase tracking-normal">
          {score}
        </span>
      )}
    </span>
  );
}
