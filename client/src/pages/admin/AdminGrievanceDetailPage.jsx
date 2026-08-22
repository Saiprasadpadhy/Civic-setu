import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import * as grievanceApi from '../../api/grievances';
import * as aiApi from '../../api/ai';
import { ROUTES } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { TimelineView } from '../../components/features/TimelineView';
import { EvidenceGallery } from '../../components/features/EvidenceGallery';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  User,
  Sparkles,
  FileCode,
  CheckCircle2,
} from 'lucide-react';

export default function AdminGrievanceDetailPage() {
  const { id } = useParams();

  const [grievance, setGrievance] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [aiReport, setAiReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, tRes, aRes, eRes, aiRes] = await Promise.all([
        adminApi.getAdminGrievanceById(id),
        adminApi.getAdminTimeline(id).catch(() => []),
        adminApi.getAdminAuditLogs(id).catch(() => []),
        grievanceApi.getGrievanceEvidence(id).catch(() => []),
        aiApi.getGrievanceAiAnalysis(id).catch(() => null),
      ]);
      setGrievance(gRes);
      setTimeline(tRes);
      setAuditLogs(aRes);
      setEvidence(eRes);
      setAiReport(aiRes);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load admin grievance details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading admin inspection file..." />;
  }

  if (!grievance) {
    return <ErrorAlert title="Not Found" message="Grievance could not be found." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.ADMIN_GRIEVANCES}>
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Back to Master List
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                {grievance.ticketId}
              </span>
              <StatusBadge status={grievance.status} />
              <PriorityBadge priority={grievance.priority} score={grievance.priorityScore} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display mt-1">
              {grievance.title}
            </h1>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Complaint & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Citizen Grievance Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {grievance.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Citizen</p>
                <p className="font-semibold text-slate-800 mt-0.5">{grievance.citizenId?.name} ({grievance.citizenId?.email})</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Assigned Ward</p>
                <p className="font-semibold text-slate-800 mt-0.5">{grievance.wardId?.name} ({grievance.wardId?.code})</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Department</p>
                <p className="font-semibold text-slate-800 mt-0.5">{grievance.departmentId?.name || 'Unassigned / NA'}</p>
              </div>
            </div>
          </Card>

          {/* Evidence Photos */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Field Evidence Photos ({evidence.length})
            </h3>
            <EvidenceGallery evidence={evidence} />
          </Card>

          {/* Status Timeline */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Lifecycle Stepper Timeline
            </h3>
            <TimelineView timeline={timeline} />
          </Card>

          {/* Security & System Audit Logs */}
          <Card className="p-6 bg-slate-900 text-white border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-purple-400 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-base font-bold font-display text-white">
                Immutable Governance Audit Trail ({auditLogs.length})
              </h3>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No audit records logged yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log._id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-mono text-purple-300 font-bold uppercase">{log.action}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300">
                      Actor: <strong className="text-white">{log.actorId?.name || log.actorRole}</strong> ({log.actorRole})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: AI Analysis & Officer Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-slate-900 text-white border-slate-800 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-blue-400 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">Gemini 2.0 Triage Analysis</span>
            </div>

            {grievance.aiAnalysis?.summary && (
              <p className="text-xs text-slate-300 leading-relaxed">
                "{grievance.aiAnalysis.summary}"
              </p>
            )}

            <div className="p-3 bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <strong className="text-white font-mono">{grievance.aiAnalysis?.modelVersion || 'gemini-2.0-flash'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Detected Language:</span>
                <strong className="text-white capitalize">{grievance.originalLanguage}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Priority Score:</span>
                <strong className="text-amber-300">{grievance.priorityScore}/100</strong>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-2 text-xs">
            <p className="font-bold text-slate-900 font-display">Officer Dispatch</p>
            <p className="text-slate-600">
              {grievance.assignedOfficerId ? (
                <>Assigned to <strong>{grievance.assignedOfficerId.name}</strong> ({grievance.assignedOfficerId.email})</>
              ) : (
                <span className="text-amber-600 font-semibold italic">Unassigned</span>
              )}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
