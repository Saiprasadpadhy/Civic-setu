import { STATUS_CONFIG } from '../../constants';

export function StatusBadge({ status, className = '' }) {
  const normalized = status?.toLowerCase() || 'submitted';
  const config = STATUS_CONFIG[normalized] || {
    label: status || 'Unknown',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
