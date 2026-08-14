import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as grievanceApi from '../../api/grievances';
import * as aiApi from '../../api/ai';
import { ROUTES } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { TimelineView } from '../../components/features/TimelineView';
import { EvidenceGallery } from '../../components/features/EvidenceGallery';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
} from 'lucide-react';

export default function CitizenGrievanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grievance, setGrievance] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [aiReport, setAiReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [retryingAi, setRetryingAi] = useState(false);
  const [error, setError] = useState(null);
  const [closeSuccessModal, setCloseSuccessModal] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, tRes, eRes, aiRes] = await Promise.all([
        grievanceApi.getGrievanceById(id),
        grievanceApi.getGrievanceTimeline(id).catch(() => []),
        grievanceApi.getGrievanceEvidence(id).catch(() => []),
        aiApi.getGrievanceAiAnalysis(id).catch(() => null),
      ]);
      setGrievance(gRes);
      setTimeline(tRes);
      setEvidence(eRes);
      setAiReport(aiRes);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCloseGrievance = async () => {
    setClosing(true);
    try {
      const updated = await grievanceApi.closeGrievance(id);
      setGrievance(updated);
      setCloseSuccessModal(true);
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to close grievance');
    } finally {
      setClosing(false);
    }
  };

  const handleRetryAi = async () => {
    setRetryingAi(true);
    try {
      await aiApi.retryGrievanceAiAnalysis(id);
      fetchDetails();
    } catch (err) {
      setError('AI retry failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRetryingAi(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading grievance details..." />;
  }

  if (!grievance) {
    return <ErrorAlert title="Not Found" message="Grievance could not be found." />;
  }

  const isResolved = grievance.status === 'resolved';
  const isClosed = grievance.status === 'closed';

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.CITIZEN_MY_GRIEVANCES}>
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Back to My List
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

        {/* Citizen Close Action if Resolved */}
        {isResolved && (
          <Button
            variant="success"
            size="md"
            loading={closing}
            onClick={handleCloseGrievance}
            icon={CheckCircle2}
            className="shadow-md"
          >
            Confirm & Close Complaint
          </Button>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Complaint Details & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Description Card */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Complaint Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {grievance.description}
            </p>

            {/* Meta tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Assigned Ward</p>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {grievance.wardId?.name} ({grievance.wardId?.code})
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Department</p>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  {grievance.departmentId?.name || 'Assigned automatically'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Submitted At</p>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(grievance.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Officer Assignment Info */}
            {grievance.assignedOfficerId && (
              <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    👮
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Field Officer Assigned: </span>
                    <strong className="text-slate-900">{grievance.assignedOfficerId.name}</strong>
                  </div>
                </div>
                <span className="text-blue-700 font-medium">{grievance.assignedOfficerId.email}</span>
              </div>
            )}
          </Card>

          {/* Resolution Summary Banner if Resolved/Closed */}
          {grievance.resolutionSummary && (
            <Card className="p-6 bg-emerald-50/50 border-emerald-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm font-display">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Officer Resolution Summary
              </div>
              <p className="text-sm text-emerald-950 whitespace-pre-wrap">
                {grievance.resolutionSummary}
              </p>
            </Card>
          )}

          {/* Before/After Evidence Gallery */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Resolution Photo Proof & Evidence ({evidence.length})
            </h3>
            <EvidenceGallery evidence={evidence} />
          </Card>

          {/* Status Timeline */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Status History Timeline
            </h3>
            <TimelineView timeline={timeline} />
          </Card>
        </div>

        {/* Right Column: AI Analysis Report & Duplicate Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Intelligence Card */}
          <Card className="p-6 bg-gradient-to-br from-indigo-950 to-slate-900 text-white border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs uppercase font-bold tracking-wider">AI Intelligence Report</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase">
                {grievance.aiStatus || 'completed'}
              </span>
            </div>

            {grievance.aiAnalysis?.summary ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">AI Executive Summary</p>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    {grievance.aiAnalysis.summary}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Language Ingested:</span>
                    <strong className="text-white capitalize">{grievance.originalLanguage || 'en'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculated Priority:</span>
                    <strong className="text-amber-300 capitalize">{grievance.priority} ({grievance.priorityScore}/100)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Severity Level:</span>
                    <strong className="text-rose-300 capitalize">{grievance.severity}</strong>
                  </div>
                </div>

                {grievance.aiAnalysis.urgencyExplanation && (
                  <p className="text-[11px] text-slate-400 italic">
                    Note: "{grievance.aiAnalysis.urgencyExplanation}"
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400">AI analysis pending or failed.</p>
                <Button
                  size="sm"
                  variant="outline"
                  loading={retryingAi}
                  onClick={handleRetryAi}
                  icon={RotateCcw}
                  className="text-white border-slate-700 hover:bg-slate-800"
                >
                  Retry Analysis
                </Button>
              </div>
            )}
          </Card>

          {/* SLA Tracking */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-2 text-xs">
            <p className="font-bold text-slate-900 font-display flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              SLA Compliance Guarantee
            </p>
            <p className="text-slate-500">
              Department resolution standard: <strong className="text-slate-800">{grievance.departmentId?.defaultSlaHours || 72} hours</strong>.
            </p>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 mt-2">
              Status: <span className="font-semibold text-emerald-600 capitalize">{grievance.sla?.status || 'On Track'}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={closeSuccessModal}
        onClose={() => setCloseSuccessModal(false)}
        title="Grievance Successfully Closed"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-700">
            Thank you for confirming resolution. Your feedback has been recorded in the civic governance audit log.
          </p>
          <Button variant="primary" size="md" onClick={() => setCloseSuccessModal(false)} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
