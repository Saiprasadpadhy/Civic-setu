import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES } from '../../constants';
import * as officerApi from '../../api/officer';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [assignedData, setAssignedData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'department'
  const [claimingId, setClaimingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOfficerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignedRes, deptRes] = await Promise.all([
        officerApi.getOfficerGrievances({ scope: 'assigned', limit: 10 }),
        officerApi.getOfficerGrievances({ scope: 'department', limit: 10 }).catch(() => ({ items: [], total: 0 })),
      ]);
      setAssignedData(assignedRes);
      setDepartmentData(deptRes);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load officer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficerData();
  }, []);

  const handleClaim = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setClaimingId(id);
    try {
      await officerApi.claimOfficerGrievance(id);
      await fetchOfficerData();
    } catch (err) {
      setError('Failed to claim ticket: ' + (err.response?.data?.message || err.message));
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading officer dispatch queue..." />;
  }

  const assignedItems = assignedData?.items || [];
  const assignedTotal = assignedData?.total || 0;
  const deptItems = departmentData?.items || [];
  const deptTotal = departmentData?.total || 0;

  const inProgressAssigned = assignedItems.filter((g) => g.status === 'in_progress').length;
  const criticalAssigned = assignedItems.filter((g) => ['high', 'critical'].includes(g.priority)).length;

  const currentItems = activeTab === 'assigned' ? assignedItems : deptItems;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-400">
            Field Officer Operations Hub & Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Officer {user?.name || 'Workspace'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Manage your personal dispatch roster, claim incoming department complaints, upload field resolution evidence, and close tickets.
          </p>
        </div>

        <Link to={ROUTES.OFFICER_GRIEVANCES}>
          <Button variant="primary" size="md" icon={FolderOpen} className="shadow-md font-bold">
            Open Full Queue ({deptTotal})
          </Button>
        </Link>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchOfficerData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned to Me"
          value={assignedTotal}
          subtitle="Your active direct queue"
          icon={Briefcase}
          color="blue"
        />

        <StatCard
          title="Department Pool"
          value={deptTotal}
          subtitle="All department complaints"
          icon={Layers}
          color="amber"
        />

        <StatCard
          title="In Progress"
          value={inProgressAssigned}
          subtitle="Under field resolution"
          icon={Clock}
          color="purple"
        />

        <StatCard
          title="Urgent Priority"
          value={criticalAssigned}
          subtitle="High/Critical SLA targets"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Queue View with Scope Switcher Tabs */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Field Action Stream
            </h3>
            <p className="text-xs text-slate-500">
              Inspect complaints, claim new department tickets, and update resolution milestones
            </p>
          </div>

          {/* Scope Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('assigned')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'assigned'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Assigned to Me ({assignedTotal})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('department')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'department'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Entire Department Pool ({deptTotal})
            </button>
          </div>
        </div>

        <CardBody className="p-0">
          {currentItems.length === 0 ? (
            <EmptyState
              title={
                activeTab === 'assigned'
                  ? 'No tickets assigned directly to you yet'
                  : 'No complaints in the department pool'
              }
              description={
                activeTab === 'assigned'
                  ? 'Switch to the "Entire Department Pool" tab above to claim incoming complaints.'
                  : 'All department complaints have been resolved or handled.'
              }
              actionText={activeTab === 'assigned' ? 'Switch to Department Pool' : undefined}
              onAction={activeTab === 'assigned' ? () => setActiveTab('department') : undefined}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {currentItems.map((grievance) => {
                const isAssignedToMe =
                  grievance.assignedOfficerId?._id === user?.id ||
                  grievance.assignedOfficerId === user?.id;

                return (
                  <Link
                    key={grievance._id}
                    to={`/officer/grievances/${grievance._id}`}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors block group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {grievance.ticketId}
                        </span>
                        <StatusBadge status={grievance.status} />
                        <PriorityBadge priority={grievance.priority} score={grievance.priorityScore} />

                        {isAssignedToMe ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            Assigned to You
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Unassigned / Pool
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 font-display group-hover:text-blue-600 transition-colors truncate">
                        {grievance.title}
                      </h4>

                      {grievance.aiAnalysis?.summary ? (
                        <div className="p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <p className="line-clamp-1">
                            <strong className="font-semibold text-indigo-900">AI Summary: </strong>
                            {grievance.aiAnalysis.summary}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {grievance.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {grievance.wardId?.name || 'Local Ward'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Reported {new Date(grievance.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          SLA: {grievance.sla?.hoursAllocated || 72}h Target
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!isAssignedToMe && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={claimingId === grievance._id}
                          onClick={(e) => handleClaim(grievance._id, e)}
                          icon={UserCheck}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                        >
                          Claim Ticket
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Inspect &rarr;
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
