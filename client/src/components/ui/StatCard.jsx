import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  color = 'blue',
  className = '',
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      gradient: 'from-blue-500/10 to-indigo-500/10',
      border: 'border-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      gradient: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      gradient: 'from-rose-500/10 to-red-500/10',
      border: 'border-rose-100',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <Card className={`p-6 relative overflow-hidden bg-gradient-to-br ${scheme.gradient} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 font-display">{value}</p>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span
                  className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                    trendDirection === 'up'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {trendDirection === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {trend}
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${scheme.bg} ${scheme.text} shadow-sm`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
