import { CheckCircle2, Clock, User, Shield, MessageSquare, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export function TimelineView({ timeline = [], className = '' }) {
  if (!timeline.length) {
    return (
      <p className="text-xs text-slate-500 italic p-4 text-center">
        No status transitions recorded yet.
      </p>
    );
  }

  const roleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">Admin</span>;
      case 'officer':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Officer</span>;
      default:
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Citizen</span>;
    }
  };

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 ${className}`}>
      {timeline.map((entry, idx) => {
        const isRemark = entry.metadata?.type === 'remark' || entry.fromStatus === entry.toStatus;
        const isResolved = entry.toStatus === 'resolved';

        return (
          <div key={idx} className="relative group">
            {/* Dot icon */}
            <div
              className={`
                absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center -translate-x-1/2
                ${
                  isResolved
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isRemark
                    ? 'border-amber-400 bg-amber-100'
                    : 'border-blue-600 bg-blue-600'
                }
              `}
            >
              {isResolved && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {entry.toStatus && !isRemark && (
                    <StatusBadge status={entry.toStatus} />
                  )}
                  {isRemark && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <MessageSquare className="w-3 h-3 text-amber-600" />
                      Officer Remark
                    </span>
                  )}
                  {roleBadge(entry.actorRole)}
                </div>

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Just now'}
                </span>
              </div>

              {entry.note && (
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">
                  {entry.note}
                </p>
              )}

              {entry.actorId?.name && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Updated by: <strong className="text-slate-600">{entry.actorId.name}</strong>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
