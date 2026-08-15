import { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
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
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Copy,
  Building2,
  Calendar,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#10b981',
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAnalyticsOverview();
      setAnalytics(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load deep analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Aggregating live municipal analytics & intelligence..." />;
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
  const byPriority = (analytics?.byPriority || []).map((p) => ({
    ...p,
    fill: PRIORITY_COLORS[p.priority] || '#3b82f6',
  }));
  const trends = analytics?.trends || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
            Executive Analytics & Intelligence Suite
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
            City Civic Intelligence & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time backend aggregations across grievance volume, department performance, SLA compliance, and temporal trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            Live DB Aggregation
          </span>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchAnalytics} />}

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Grievances"
          value={kpis.total}
          subtitle="All-time intake"
          icon={BarChart3}
          color="blue"
        />

        <StatCard
          title="Pending Queue"
          value={kpis.pending}
          subtitle="Active in-field"
          icon={Clock}
          color="purple"
        />

        <StatCard
          title="Resolution Rate"
          value={`${kpis.resolutionRate}%`}
          subtitle={`${kpis.resolved} resolved`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Avg Resolution"
          value={`${kpis.avgResolutionHours}h`}
          subtitle="Turnaround speed"
          icon={TrendingUp}
          color="cyan"
        />

        <StatCard
          title="SLA Compliance"
          value={`${sla.complianceRate}%`}
          subtitle={`${sla.breached} breached`}
          icon={ShieldAlert}
          color={sla.breached > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Spam / Duplicates"
          value={`${kpis.spamCount} / ${kpis.duplicateCount}`}
          subtitle="Filtered intake"
          icon={Copy}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Temporal Complaint Trends Area Chart (8 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-8 shadow-sm">
          <CardHeader
            title="Intake & Resolution Trends"
            subtitle="Daily complaint submission and resolution velocity"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-72 w-full pt-4">
            {trends.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-28">No temporal trend data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="New Submissions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  <Area type="monotone" dataKey="resolved" name="Resolved Tickets" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Priority Breakdown (4 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-4 shadow-sm">
          <CardHeader
            title="Urgency & Severity"
            subtitle="AI computed priority classification"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-72 w-full pt-4">
            {byPriority.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-28">No priority data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byPriority}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {byPriority.map((entry, index) => (
                      <Cell key={`prio-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Department SLA & Workload Performance (6 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-6 shadow-sm">
          <CardHeader
            title="Department Workload & Compliance"
            subtitle="Complaints handled by municipal departments"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-72 w-full pt-4">
            {byDepartment.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-28">No department data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDepartment} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="code" type="category" stroke="#94a3b8" fontSize={11} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="resolvedCount" name="Resolved" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pendingCount" name="Pending" fill="#3b82f6" stackId="a" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Ward Distribution (6 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-6 shadow-sm">
          <CardHeader
            title="Grievances by Municipal Ward"
            subtitle="Geographical issue distribution across active wards"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-72 w-full pt-4">
            {byWard.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-28">No ward distribution data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byWard}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Total Complaints" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Category Classification Breakdown Pie Chart (12 cols) */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-12 shadow-sm">
          <CardHeader
            title="Categorical Classification Share"
            subtitle="Percentage share of reported civic infrastructure categories"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-72 w-full pt-4">
            {byCategory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-28">No category data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="count"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {byCategory.map((entry, index) => (
                      <Cell key={`cat-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
