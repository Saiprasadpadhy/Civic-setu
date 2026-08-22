import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES } from '../../constants';
import * as grievanceApi from '../../api/grievances';
import * as budgetApi from '../../api/budget';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  PlusCircle,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Vote,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  AlertTriangle,
  FileCheck,
  Building2,
  ThumbsUp,
  Image as ImageIcon,
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [budgetProjects, setBudgetProjects] = useState([]);
  const [votingId, setVotingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'resolved'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, bRes] = await Promise.all([
        grievanceApi.getMyGrievances({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
        budgetApi.getBudgetProjects({ limit: 3 }).catch(() => []),
      ]);
      setData(gRes);
      setBudgetProjects(bRes.slice(0, 3));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load citizen workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickVote = async (id) => {
    setVotingId(id);
    try {
      const res = await budgetApi.voteOnBudgetProject(id);
      setBudgetProjects((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                voteCount: res.data?.project?.voteCount ?? (p.hasVoted ? p.voteCount - 1 : p.voteCount + 1),
                hasVoted: res.data?.hasVoted,
              }
            : p
        )
      );
    } catch (err) {
      setError('Voting failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setVotingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading citizen dashboard..." />;
  }

  const items = data?.items || [];
  const total = data?.total || 0;

  const activeComplaints = items.filter((g) => !['resolved', 'closed'].includes(g.status));
  const resolvedComplaints = items.filter((g) => ['resolved', 'closed'].includes(g.status));

  const displayedComplaints =
    activeTab === 'active'
      ? activeComplaints
      : activeTab === 'resolved'
        ? resolvedComplaints
        : items;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10">
          <span className="text-xs uppercase font-bold tracking-widest text-blue-200">
            Citizen Workspace & Civic Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Namaste, {user?.name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-lg">
            Track your civic complaints with AI-assisted triage, monitor resolution proof, and participate in participatory budget voting.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2">
          <Link to={ROUTES.CITIZEN_SUBMIT_GRIEVANCE}>
            <Button variant="secondary" size="md" icon={PlusCircle} className="bg-white text-blue-700 hover:bg-blue-50 border-none shadow-md font-bold">
              Report New Issue
            </Button>
          </Link>
          <Link to={ROUTES.CITIZEN_PUBLIC_WORKS}>
            <Button variant="outline" size="md" icon={Vote} className="bg-blue-700/60 text-white hover:bg-blue-700 border-white/30">
              Ward Budget Voting
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchDashboardData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reported"
          value={total}
          subtitle="All-time complaints"
          icon={FolderOpen}
          color="blue"
        />

        <StatCard
          title="Active Complaints"
          value={activeComplaints.length}
          subtitle="In-flight triage / progress"
          icon={Clock}
          color="purple"
        />

        <StatCard
          title="Resolved & Verified"
          value={resolvedComplaints.length}
          subtitle="Resolution evidence ready"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Resolution Rate"
          value={`${total > 0 ? Math.round((resolvedComplaints.length / total) * 100) : 0}%`}
          subtitle="Completion health"
          icon={FileCheck}
          color="cyan"
        />
      </div>

      {/* Main Grid: Complaints List (8 cols) + Participatory Budget Spotlight (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grievances Section (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-white border-slate-200/80 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  My Grievance Stream
                </h3>
                <p className="text-xs text-slate-500">
                  Track live lifecycle stage, SLA deadline, AI summaries, and resolution proof
                </p>
              </div>

              {/* Tab Filters */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'active' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Active ({activeComplaints.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('resolved')}
                  className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'resolved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Resolved ({resolvedComplaints.length})
                </button>
              </div>
            </div>

            <CardBody className="p-0">
              {displayedComplaints.length === 0 ? (
                <EmptyState
                  title={`No ${activeTab !== 'all' ? activeTab : ''} grievances found`}
                  description="Submit a complaint regarding civic amenities like potholes, garbage, streetlights, or drainage."
                  actionText="Report an Issue"
                  onAction={() => window.location.href = ROUTES.CITIZEN_SUBMIT_GRIEVANCE}
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayedComplaints.map((grievance) => {
                    const isResolved = ['resolved', 'closed'].includes(grievance.status);

                    return (
                      <Link
                        key={grievance._id}
                        to={`/citizen/grievances/${grievance._id}`}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors block group"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Badges Bar */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {grievance.ticketId}
                            </span>
                            <StatusBadge status={grievance.status} />
                            <PriorityBadge priority={grievance.priority} score={grievance.priorityScore} />

                            {grievance.isDuplicate && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Potential Duplicate
                              </span>
                            )}

                            {isResolved && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Evidence Ready
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-base font-bold text-slate-900 font-display group-hover:text-blue-600 transition-colors truncate">
                            {grievance.title}
                          </h4>

                          {/* AI Summary Banner if available */}
                          {grievance.aiAnalysis?.summary ? (
                            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <p className="line-clamp-2">
                                <strong className="font-semibold text-indigo-900">AI Summary: </strong>
                                {grievance.aiAnalysis.summary}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {grievance.description}
                            </p>
                          )}

                          {/* Meta line: Ward, Department, SLA countdown */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {grievance.wardId?.name || 'Local Ward'}
                            </span>

                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {grievance.departmentId?.name || (grievance.category === 'invalid' || !grievance.departmentId ? 'Unassigned / NA' : 'Unassigned')}
                            </span>

                            <span className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              SLA Target: <strong>{grievance.departmentId ? `${grievance.departmentId.defaultSlaHours || 72}h` : 'NA'}</strong>
                            </span>

                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(grievance.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className="text-xs font-bold text-blue-600 group-hover:underline inline-flex items-center gap-1">
                            {isResolved ? 'Inspect Proof & Close' : 'View Timeline'} &rarr;
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Participatory Budgeting Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-gradient-to-br from-purple-900 to-indigo-950 text-white border-purple-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-purple-800 pb-3">
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4 text-purple-300" />
                <h3 className="text-sm font-bold text-white font-display">
                  Ward Budget Voting
                </h3>
              </div>
              <Link to={ROUTES.CITIZEN_PUBLIC_WORKS} className="text-[11px] text-purple-300 hover:text-white font-semibold underline">
                View Ballot &rarr;
              </Link>
            </div>

            <p className="text-xs text-purple-200 leading-relaxed">
              Vote for community public works projects. Projects with the highest citizen support receive municipal capital funding.
            </p>

            <div className="space-y-3">
              {budgetProjects.map((p) => (
                <div
                  key={p._id}
                  className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-800/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{p.title}</h4>
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      ₹{(p.estimatedCost || 0).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-purple-200 line-clamp-2">{p.description}</p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-purple-300 font-semibold">
                      {p.voteCount || 0} Votes
                    </span>

                    <Button
                      size="sm"
                      variant={p.hasVoted ? 'success' : 'secondary'}
                      loading={votingId === p._id}
                      onClick={() => handleQuickVote(p._id)}
                      icon={ThumbsUp}
                      className="text-xs py-1 h-auto px-2.5"
                    >
                      {p.hasVoted ? 'Voted' : 'Vote'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Link to={ROUTES.CITIZEN_PUBLIC_WORKS} className="block">
              <Button variant="outline" size="sm" className="w-full text-white border-purple-400 hover:bg-purple-800">
                Explore All Community Projects
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
