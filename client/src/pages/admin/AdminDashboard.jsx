import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import * as refApi from '../../api/reference';
import { ROUTES } from '../../constants';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Building2,
  BarChart3,
  Flame,
  FileSpreadsheet,
  Vote,
  Copy,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#e11d48', '#0891b2'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [slaAlerts, setSlaAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, gRes, slaRes] = await Promise.all([
        adminApi.getAnalyticsOverview(),
        adminApi.getAdminGrievances({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
        adminApi.getSLAMonitoringData(),
      ]);
      setAnalytics(analyticsRes);
      setRecentGrievances(gRes?.items || []);
      setSlaAlerts((slaRes?.items || []).filter((g) => ['breached', 'at_risk'].includes(g.slaStatus)).slice(0, 4));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load executive admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading municipal administrative intelligence..." />;
  }

  const kpis = analytics?.kpis || {
    total: 0,
    resolved: 0,
    pending: 0,
    resolutionRate: 0,
    avgResolutionHours: 24,
    spamCount: 0,
    duplicateCount: 0,
  };

  const sla = analytics?.slaCompliance || {
    onTrack: 0,
    atRisk: 0,
    breached: 0,
    totalOpen: 0,
    complianceRate: 100,
  };

  const byCategory = analytics?.byCategory || [];
  const byDepartment = analytics?.byDepartment || [];
  const byWard = analytics?.byWard || [];
  const trends = analytics?.trends || [];
  const publicWorks = analytics?.publicWorksSummary || { totalProjects: 0, totalProposedCost: 0, totalVotes: 0 };

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Command Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-400">
            Smart City Governance Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Executive Administrative Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Integrated live telemetry: grievance intake, department SLA compliance, spatial heatmap, spam filtering, and participatory budgeting.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.ADMIN_WARD_HEATMAP}>
            <Button variant="outline" size="md" icon={MapPin} className="text-white border-slate-700 hover:bg-slate-800">
              Ward Heatmap
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_ANALYTICS}>
            <Button variant="primary" size="md" icon={BarChart3} className="font-bold shadow-md">
              Deep Analytics
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchDashboard} />}

      {/* KPI Stat Cards (6 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Intake"
          value={kpis.total}
          subtitle="City-wide intake"
          icon={FileSpreadsheet}
          color="blue"
        />

        <StatCard
          title="Resolution Rate"
          value={`${kpis.resolutionRate}%`}
          subtitle={`${kpis.resolved} resolved`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Active In-Field"
          value={kpis.pending}
          subtitle="Assigned/In progress"
          icon={Clock}
          color="purple"
        />

        <StatCard
          title="SLA Compliance"
          value={`${sla.complianceRate}%`}
          subtitle={`${sla.breached} breached`}
          icon={Flame}
          color={sla.breached > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Spam / Duplicates"
          value={`${kpis.spamCount} / ${kpis.duplicateCount}`}
          subtitle="AI flagged items"
          icon={Copy}
          color="amber"
        />

        <StatCard
          title="Budget Voting"
          value={publicWorks.totalVotes}
          subtitle={`${publicWorks.totalProjects} projects`}
          icon={Vote}
          color="indigo"
        />
      </div>

      {/* SLA Urgent Radar Alert Bar (if breached or at-risk tickets exist) */}
      {slaAlerts.length > 0 && (
        <Card className="p-4 bg-rose-50/70 border-rose-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-950 font-display">
                  Urgent SLA Breaches & Escalations ({slaAlerts.length} Critical Tickets)
                </h4>
                <p className="text-xs text-rose-700">
                  Target resolution windows have expired or are nearing expiration (&lt; 24h).
                </p>
              </div>
            </div>

            <Link to={ROUTES.ADMIN_SLA_MONITORING}>
              <Button variant="outline" size="sm" className="text-rose-700 border-rose-300 hover:bg-rose-100">
                View SLA Escalations &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Temporal Trends Area Chart (7 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-7 shadow-sm">
          <CardHeader
            title="Complaint Intake & Resolution Trends"
            subtitle="Real-time daily submission and resolution volume"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-64 w-full pt-4">
            {trends.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-24">No trend data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="dbCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="count" name="New Grievances" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#dbCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Category Breakdown Pie Chart (5 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-5 shadow-sm">
          <CardHeader
            title="Categorical Classification"
            subtitle="AI categorized grievance volume"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-64 w-full pt-4">
            {byCategory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-24">No category data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Mini Spatial Heatmap and Department Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ward Distribution & Heatmap Shortcut (6 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-6 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader
              title="Geographical Ward Distribution"
              subtitle="Concentration of active civic complaints by municipal ward"
              className="p-0 pb-4 border-b border-slate-100"
              action={
                <Link to={ROUTES.ADMIN_WARD_HEATMAP}>
                  <Button variant="ghost" size="sm" icon={MapPin} className="text-xs text-blue-600">
                    Open Heatmap &rarr;
                  </Button>
                </Link>
              }
            />
            <div className="h-56 w-full pt-4">
              {byWard.length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-20">No ward data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byWard}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Complaints" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Card>

        {/* Department Workload & SLA Compliance (6 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-6 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader
              title="Department Resolution Performance"
              subtitle="Workload breakdown and SLA turnaround compliance"
              className="p-0 pb-4 border-b border-slate-100"
              action={
                <Link to={ROUTES.ADMIN_DEPARTMENTS}>
                  <Button variant="ghost" size="sm" icon={Building2} className="text-xs text-blue-600">
                    Manage Depts &rarr;
                  </Button>
                </Link>
              }
            />
            <div className="h-56 w-full pt-4">
              {byDepartment.length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-20">No department data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend />
                    <Bar dataKey="resolvedCount" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendingCount" name="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Platform Grievance Intake Stream */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader
          title="Recent Municipal Submissions"
          subtitle="Real-time intake stream with AI categorization, SLA status, and officer assignment"
          action={
            <Link to={ROUTES.ADMIN_GRIEVANCES}>
              <Button variant="ghost" size="sm" icon={ArrowRight}>
                View All ({kpis.total})
              </Button>
            </Link>
          }
        />

        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {recentGrievances.map((g) => (
              <Link
                key={g._id}
                to={`/admin/grievances/${g._id}`}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors block group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {g.ticketId}
                    </span>
                    <StatusBadge status={g.status} />
                    <PriorityBadge priority={g.priority} score={g.priorityScore} />
                    {g.isDuplicate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Duplicate Candidate
                      </span>
                    )}
                    {g.spamResult?.isSpam && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        Spam Flagged
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 font-display group-hover:text-blue-600 truncate">
                    {g.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>Citizen: <strong className="text-slate-600">{g.citizenId?.name || 'Citizen'}</strong></span>
                    <span>Ward: <strong className="text-slate-600">{g.wardId?.name || 'Ward'}</strong></span>
                    <span>Officer: <strong className="text-slate-600">{g.assignedOfficerId?.name || 'Unassigned'}</strong></span>
                    <span>SLA: <strong className="text-slate-600">{g.sla?.hoursAllocated || 72}h target</strong></span>
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  <span className="text-xs font-bold text-blue-600 group-hover:underline">
                    Admin Inspect &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
