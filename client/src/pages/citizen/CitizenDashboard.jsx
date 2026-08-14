import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES } from '../../constants';
import * as grievanceApi from '../../api/grievances';
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
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceApi.getMyGrievances({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading citizen dashboard..." />;
  }

  const items = data?.items || [];
  const total = data?.total || 0;

  const inProgressCount = items.filter((g) => ['in_progress', 'assigned'].includes(g.status)).length;
  const resolvedCount = items.filter((g) => ['resolved', 'closed'].includes(g.status)).length;
  const submittedCount = items.filter((g) => ['submitted', 'under_review'].includes(g.status)).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10">
          <span className="text-xs uppercase font-bold tracking-widest text-blue-200">
            Citizen Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Namaste, {user?.name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-lg">
            Track your submitted civic issues, monitor live resolution progress, or voice your opinion in ward budgeting.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2">
          <Link to={ROUTES.CITIZEN_SUBMIT_GRIEVANCE}>
            <Button variant="secondary" size="md" icon={PlusCircle} className="bg-white text-blue-700 hover:bg-blue-50 border-none shadow-md font-bold">
              Submit Grievance
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
          title="In Progress"
          value={inProgressCount}
          subtitle="Assigned to field officers"
          icon={Clock}
          color="purple"
        />

        <StatCard
          title="Resolved / Closed"
          value={resolvedCount}
          subtitle="Verified resolutions"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Under Review"
          value={submittedCount}
          subtitle="Pending triage"
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Recent Grievances List */}
      <Card className="bg-white border-slate-200/80 shadow-sm">
        <CardHeader
          title="Recent Grievances"
          subtitle="Live status of your submitted civic complaints"
          action={
            <Link to={ROUTES.CITIZEN_MY_GRIEVANCES}>
              <Button variant="ghost" size="sm" icon={ArrowRight}>
                View All ({total})
              </Button>
            </Link>
          }
        />

        <CardBody className="p-0">
          {items.length === 0 ? (
            <EmptyState
              title="No grievances submitted yet"
              description="Report an issue like potholes, streetlights, garbage, or water leaks with live AI analysis."
              actionText="Submit Your First Grievance"
              onAction={() => window.location.href = ROUTES.CITIZEN_SUBMIT_GRIEVANCE}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((grievance) => (
                <Link
                  key={grievance._id}
                  to={`/citizen/grievances/${grievance._id}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors block group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {grievance.ticketId}
                      </span>
                      <StatusBadge status={grievance.status} />
                      <PriorityBadge priority={grievance.priority} score={grievance.priorityScore} />
                    </div>

                    <h4 className="text-base font-bold text-slate-900 font-display group-hover:text-blue-600 transition-colors truncate">
                      {grievance.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {grievance.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {grievance.wardId?.name || 'Local Ward'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(grievance.createdAt).toLocaleDateString()}
                      </span>
                      {grievance.aiAnalysis?.summary && (
                        <span className="flex items-center gap-1 text-indigo-600 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Summarized
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                      View Details & Timeline &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
