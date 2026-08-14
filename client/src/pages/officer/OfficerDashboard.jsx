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
} from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [assignedData, setAssignedData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOfficerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignedRes, deptRes] = await Promise.all([
        officerApi.getOfficerGrievances({ scope: 'assigned', limit: 5 }),
        officerApi.getOfficerGrievances({ scope: 'department', limit: 5 }).catch(() => ({ items: [], total: 0 })),
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

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading officer dispatch queue..." />;
  }

  const assignedItems = assignedData?.items || [];
  const assignedTotal = assignedData?.total || 0;
  const deptTotal = departmentData?.total || 0;

  const inProgressAssigned = assignedItems.filter((g) => g.status === 'in_progress').length;
  const criticalAssigned = assignedItems.filter((g) => ['high', 'critical'].includes(g.priority)).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-400">
            Field Officer Operations Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Officer {user?.name || 'Workspace'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Manage your assigned complaints, perform field triage, upload resolution evidence, and close service tickets.
          </p>
        </div>

        <Link to={ROUTES.OFFICER_GRIEVANCES}>
          <Button variant="primary" size="md" icon={FolderOpen} className="shadow-md font-bold">
            View Assigned Queue
          </Button>
        </Link>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchOfficerData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned to Me"
          value={assignedTotal}
          subtitle="Active direct queue"
          icon={Briefcase}
          color="blue"
        />

        <StatCard
          title="In Progress"
          value={inProgressAssigned}
          subtitle="Work dispatched"
          icon={Clock}
          color="purple"
        />

        <StatCard
          title="High / Critical Priority"
          value={criticalAssigned}
          subtitle="Urgent SLA targets"
          icon={AlertTriangle}
          color="rose"
        />

        <StatCard
          title="Department Backlog"
          value={deptTotal}
          subtitle="Pool tickets"
          icon={Layers}
          color="amber"
        />
      </div>

      {/* Assigned Queue Quick Preview */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader
          title="My Active Assigned Queue"
          subtitle="Top assigned civic grievances awaiting your action"
          action={
            <Link to={ROUTES.OFFICER_GRIEVANCES}>
              <Button variant="ghost" size="sm" icon={ArrowRight}>
                Full Queue ({assignedTotal})
              </Button>
            </Link>
          }
        />

        <CardBody className="p-0">
          {assignedItems.length === 0 ? (
            <EmptyState
              title="No tickets assigned to you right now"
              description="Your assigned queue is completely clear. You can check the department pool for open complaints."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {assignedItems.map((grievance) => (
                <Link
                  key={grievance._id}
                  to={`/officer/grievances/${grievance._id}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors block group"
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
                        {grievance.wardId?.name} ({grievance.wardId?.code})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Reported {new Date(grievance.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="outline" size="sm">
                      Take Action &rarr;
                    </Button>
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
