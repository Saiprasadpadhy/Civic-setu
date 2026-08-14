import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DuplicateWarning({
  duplicateReport,
  className = '',
}) {
  const duplicates = duplicateReport?.possibleDuplicates || duplicateReport?.duplicatePreview?.possibleDuplicates || [];

  if (!duplicates.length) return null;

  return (
    <div
      className={`p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-950 font-display">
            Possible Similar Complaint Detected ({duplicates.length})
          </h4>
          <p className="text-xs text-amber-800 mt-0.5">
            A similar issue was recently reported in this immediate vicinity. You can still submit if your issue is different or additional.
          </p>

          <div className="mt-3 space-y-2">
            {duplicates.slice(0, 3).map((dup, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between text-xs gap-2"
              >
                <div>
                  <p className="font-semibold text-slate-800">{dup.title || 'Similar Grievance'}</p>
                  <p className="text-[11px] text-slate-500">{dup.matchReason || 'Close geographical and keyword similarity'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                    {Math.round(dup.confidence * 100)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
