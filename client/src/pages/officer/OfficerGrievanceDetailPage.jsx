import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as officerApi from '../../api/officer';
import * as grievanceApi from '../../api/grievances';
import { ROUTES } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { TimelineView } from '../../components/features/TimelineView';
import { EvidenceGallery } from '../../components/features/EvidenceGallery';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  UploadCloud,
  FileCheck,
  MapPin,
  Calendar,
  Building2,
  User,
  Shield,
  Sparkles,
} from 'lucide-react';

export default function OfficerGrievanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grievance, setGrievance] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Actions state
  const [remarkText, setRemarkText] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);

  // Resolve modal state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolving, setResolving] = useState(false);

  // Evidence upload modal state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceType, setEvidenceType] = useState('after');
  const [evidenceCaption, setEvidenceCaption] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, tRes, eRes] = await Promise.all([
        officerApi.getOfficerGrievanceById(id),
        grievanceApi.getGrievanceTimeline(id).catch(() => []),
        grievanceApi.getGrievanceEvidence(id).catch(() => []),
      ]);
      setGrievance(gRes);
      setTimeline(tRes);
      setEvidence(eRes);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load grievance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    setError(null);
    try {
      const updated = await officerApi.updateOfficerGrievanceStatus(id, {
        status: newStatus,
        note: `Status moved to ${newStatus} by field officer`,
      });
      setGrievance(updated);
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    setAddingRemark(true);
    try {
      await officerApi.addOfficerRemark(id, remarkText.trim());
      setRemarkText('');
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add remark');
    } finally {
      setAddingRemark(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionSummary.trim()) return;

    setResolving(true);
    try {
      const updated = await officerApi.resolveOfficerGrievance(id, resolutionSummary.trim());
      setGrievance(updated);
      setResolveModalOpen(false);
      setResolutionSummary('');
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resolve grievance');
    } finally {
      setResolving(false);
    }
  };

  const handleEvidenceUpload = async (e) => {
    e.preventDefault();
    if (!evidenceUrl.trim()) return;

    setUploadingEvidence(true);
    try {
      await officerApi.uploadOfficerResolutionEvidence(id, {
        url: evidenceUrl.trim(),
        mimeType: 'image/jpeg',
        evidenceType,
        caption: evidenceCaption.trim() || 'Field Resolution Evidence',
        notes: evidenceNotes.trim() || undefined,
      });
      setEvidenceModalOpen(false);
      setEvidenceUrl('');
      setEvidenceCaption('');
      setEvidenceNotes('');
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload resolution evidence');
    } finally {
      setUploadingEvidence(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading officer grievance workspace..." />;
  }

  if (!grievance) {
    return <ErrorAlert title="Not Found" message="Grievance could not be found." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.OFFICER_GRIEVANCES}>
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Back to Queue
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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(!grievance.assignedOfficerId || ['submitted', 'under_review'].includes(grievance.status)) && (
            <Button
              variant="primary"
              size="md"
              loading={statusUpdating}
              onClick={async () => {
                setStatusUpdating(true);
                setError(null);
                try {
                  const updated = await officerApi.claimOfficerGrievance(id);
                  setGrievance(updated);
                  fetchDetails();
                } catch (err) {
                  setError('Failed to claim ticket: ' + (err.response?.data?.message || err.message));
                } finally {
                  setStatusUpdating(false);
                }
              }}
              icon={CheckCircle2}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
            >
              Claim & Assign to Myself
            </Button>
          )}

          {grievance.status === 'assigned' && (
            <Button
              variant="primary"
              size="md"
              loading={statusUpdating}
              onClick={() => handleStatusChange('in_progress')}
              icon={Clock}
            >
              Mark In Progress
            </Button>
          )}

          {['assigned', 'in_progress'].includes(grievance.status) && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => setEvidenceModalOpen(true)}
                icon={UploadCloud}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Upload Evidence
              </Button>

              <Button
                variant="success"
                size="md"
                onClick={() => setResolveModalOpen(true)}
                icon={CheckCircle2}
                className="shadow-md shadow-emerald-500/20"
              >
                Resolve Grievance
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Complaint & Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Complaint Description */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Citizen Complaint Details
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {grievance.description}
            </p>

            {/* Meta tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Reporting Citizen</p>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {grievance.citizenId?.name || 'Citizen'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Location Ward</p>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {grievance.wardId?.name} ({grievance.wardId?.code})
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Reported Date</p>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(grievance.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Officer Remarks Form */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              Add Internal Field Remark / Update Note
            </h3>
            <form onSubmit={handleAddRemark} className="space-y-3">
              <Textarea
                placeholder="Enter field observation, contractor dispatch note, or inspection status..."
                rows={2}
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  loading={addingRemark}
                >
                  Post Remark to Timeline
                </Button>
              </div>
            </form>
          </Card>

          {/* Evidence Gallery */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Resolution Evidence ({evidence.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEvidenceModalOpen(true)}
                icon={UploadCloud}
              >
                Add Proof Photo
              </Button>
            </div>
            <EvidenceGallery evidence={evidence} />
          </Card>

          {/* Timeline View */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Complete Action Timeline
            </h3>
            <TimelineView timeline={timeline} />
          </Card>
        </div>

        {/* Right Column: AI Triage & SLA (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Report */}
          <Card className="p-6 bg-slate-900 text-white border-slate-800 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-blue-400 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">AI Classification</span>
            </div>

            {grievance.aiAnalysis?.summary && (
              <p className="text-xs text-slate-300 leading-relaxed">
                "{grievance.aiAnalysis.summary}"
              </p>
            )}

            <div className="p-3 bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <strong className="text-white capitalize">{grievance.category}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Priority Score:</span>
                <strong className="text-amber-300">{grievance.priorityScore}/100</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Severity:</span>
                <strong className="text-rose-300 capitalize">{grievance.severity}</strong>
              </div>
            </div>
          </Card>

          {/* SLA Tracker */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-2 text-xs">
            <p className="font-bold text-slate-900 font-display flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              Department SLA Clock
            </p>
            <p className="text-slate-500">
              Allocated response window: <strong>{grievance.departmentId?.defaultSlaHours || 72} hours</strong>.
            </p>
          </Card>
        </div>
      </div>

      {/* Resolve Grievance Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Civic Grievance"
        subtitle={`Ticket ${grievance.ticketId} — Provide resolution details`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <Textarea
            label="Resolution Summary *"
            rows={4}
            placeholder="Explain the repair actions taken, materials replaced, or contractor execution details..."
            value={resolutionSummary}
            onChange={(e) => setResolutionSummary(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="md"
              loading={resolving}
              icon={CheckCircle2}
            >
              Submit & Mark Resolved
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Evidence Modal */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Upload Resolution Evidence Photo"
        subtitle="Provide verified before/after inspection documentation"
      >
        <form onSubmit={handleEvidenceUpload} className="space-y-4">
          <Input
            label="Photo URL *"
            placeholder="https://example.com/pothole-repaired.jpg"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            required
          />

          <Select
            label="Evidence Stage *"
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
          >
            <option value="after">After Repair (Completion Proof)</option>
            <option value="in_progress">Work In Progress Inspection</option>
            <option value="before">Before Work Assessment</option>
          </Select>

          <Input
            label="Caption / Tag"
            placeholder="e.g. Fresh asphalt laid & compacted"
            value={evidenceCaption}
            onChange={(e) => setEvidenceCaption(e.target.value)}
          />

          <Textarea
            label="Technical Notes"
            rows={2}
            placeholder="Additional contractor or inspector notes..."
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEvidenceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={uploadingEvidence}
              icon={UploadCloud}
            >
              Save Resolution Evidence
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
