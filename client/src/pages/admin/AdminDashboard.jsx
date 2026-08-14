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
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, dRes, wRes] = await Promise.all([
        adminApi.getAdminGrievances({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
        refApi.getDepartments().catch(() => []),
        refApi.getWards().catch(() => []),
      ]);
      setData(gRes);
      setDepartments(dRes);
      setWards(wRes);
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

  const items = data?.items || [];
  const total = data?.total || 0;

  const resolvedCount = items.filter((g) => ['resolved', 'closed'].includes(g.status)).length;
  const inProgressCount = items.filter((g) => ['in_progress', 'assigned'].includes(g.status)).length;
  const criticalCount = items.filter((g) => ['high', 'critical'].includes(g.priority)).length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  // Chart 1: Status Distribution
  const statusCounts = items.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.keys(statusCounts).map((st) => ({
    name: st.replace('_', ' ').toUpperCase(),
    count: statusCounts[st],
  }));

  // Chart 2: Category Breakdown
  const categoryCounts = items.reduce((acc, g) => {
    const cat = g.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.keys(categoryCounts).map((cat) => ({
    name: cat.toUpperCase(),
    value: categoryCounts[cat],
  }));

  const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#e11d48', '#0891b2'];

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-400">
            Smart City Governance Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Executive Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time municipal triage tracking, department SLA performance, and participatory budget oversight.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.ADMIN_GRIEVANCES}>
            <Button variant="primary" size="md" icon={FileSpreadsheet} className="font-bold shadow-md">
              Manage All Grievances
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_ANALYTICS}>
            <Button variant="outline" size="md" icon={BarChart3} className="text-white border-slate-700 hover:bg-slate-800">
              Deep Analytics
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchDashboard} />}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Grievances"
          value={total}
          subtitle="City-wide intake"
          icon={FileSpreadsheet}
          color="blue"
        />

        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          subtitle={`${resolvedCount} resolved/closed`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Active In-Field"
          value={inProgressCount}
          subtitle="Assigned or in progress"
          icon={Clock}
          color="purple"
        />

        <StatCard
          title="High / Critical SLA"
          value={criticalCount}
          subtitle="Priority radar alerts"
          icon={Flame}
          color="rose"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Bar Chart */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-7 shadow-sm">
          <CardHeader
            title="Grievance Status Distribution"
            subtitle="Current volume across lifecycle stages"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-64 w-full pt-4">
            {statusChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-24">No status data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="p-6 bg-white border-slate-200 lg:col-span-5 shadow-sm">
          <CardHeader
            title="Category Breakdown"
            subtitle="Grievances categorized by Gemini AI"
            className="p-0 pb-4 border-b border-slate-100"
          />
          <div className="h-64 w-full pt-4">
            {categoryChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-24">No category data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
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

      {/* Recent Master Grievances Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader
          title="Recent Platform Submissions"
          subtitle="Real-time intake stream with AI categorization and officer assignment"
          action={
            <Link to={ROUTES.ADMIN_GRIEVANCES}>
              <Button variant="ghost" size="sm" icon={ArrowRight}>
                View All Grievances ({total})
              </Button>
            </Link>
          }
        />

        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {items.slice(0, 5).map((g) => (
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
                  </div>

                  <h4 className="text-base font-bold text-slate-900 font-display group-hover:text-blue-600 truncate">
                    {g.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>Citizen: <strong className="text-slate-600">{g.citizenId?.name || 'Citizen'}</strong></span>
                    <span>Ward: <strong className="text-slate-600">{g.wardId?.name || 'Ward'}</strong></span>
                    <span>Officer: <strong className="text-slate-600">{g.assignedOfficerId?.name || 'Unassigned'}</strong></span>
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
