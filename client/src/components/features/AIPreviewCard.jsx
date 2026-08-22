import { Sparkles, Brain, ShieldAlert, Users, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';

export function AIPreviewCard({
  previewData,
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 shadow-sm animate-pulse ${className}`}>
        <div className="flex items-center gap-2 text-blue-600 mb-3">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Gemini AI is analyzing complaint in real time...</span>
        </div>
        <div className="h-4 bg-blue-200/60 rounded w-3/4 mb-2" />
        <div className="h-3 bg-blue-200/40 rounded w-1/2" />
      </div>
    );
  }

  if (!previewData) return null;

  const textAnalysis = previewData.textAnalysis || {};
  const priority = previewData.priority || {};
  const hints = textAnalysis.semanticHints || {};
  const imageAnalysis = previewData.imageAnalysis;

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br from-[#06182a] via-[#0A2540] to-[#0f2d4e] text-white shadow-xl border border-amber-500/20 relative overflow-hidden ${className}`}>
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2 text-amber-400">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
            Live AI Triage Analysis
          </span>
        </div>
        <PriorityBadge priority={priority.priority || 'medium'} score={priority.score} />
      </div>

      {/* Quick classification pill row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Detected Category</p>
          <p className="text-xs font-bold text-white mt-0.5 capitalize">{textAnalysis.category || 'General'}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Department Route</p>
          <p className="text-xs font-bold text-blue-300 mt-0.5">
            {textAnalysis.suggestedDepartment && !['NONE', 'N/A', 'NA', 'UNASSIGNED', 'INVALID', 'OTHER', 'NULL'].includes(textAnalysis.suggestedDepartment.toUpperCase().trim())
              ? textAnalysis.suggestedDepartment
              : 'Unassigned / NA'}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Calculated Severity</p>
          <p className="text-xs font-bold text-amber-300 mt-0.5 capitalize">{textAnalysis.severity || 'Medium'}</p>
        </div>
      </div>

      {/* Summary */}
      {textAnalysis.summary && (
        <div className="mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> AI Executive Summary
          </p>
          <p className="text-xs text-slate-200 leading-relaxed">{textAnalysis.summary}</p>
        </div>
      )}

      {/* Semantic factors */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
          Priority Factors (Score: {priority.score}/100)
        </p>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block">Safety Impact</span>
            <span className="font-bold text-rose-300">{Math.round((hints.safetyImpact || 0.5) * 100)}%</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block">Population</span>
            <span className="font-bold text-amber-300">{Math.round((hints.affectedPopulation || 0.5) * 100)}%</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block">Essential Need</span>
            <span className="font-bold text-emerald-300">{Math.round((hints.essentialServiceImpact || 0.5) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Image Vision Insight */}
      {imageAnalysis && imageAnalysis.likelyIssue && (
        <div className="mt-3 p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-start gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-200">Vision Confirmed: </span>
            <span className="text-slate-300">{imageAnalysis.likelyIssue} ({Math.round((imageAnalysis.confidence || 0.8) * 100)}% confidence)</span>
          </div>
        </div>
      )}
    </div>
  );
}
