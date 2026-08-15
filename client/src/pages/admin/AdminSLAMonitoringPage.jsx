import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import * as refApi from '../../api/reference';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

export default function AdminSLAMonitoringPage() {
  const [data, setData] = useState({ stats: {}, items: [] });
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSLAMonitoring = async () => {
    setLoading(true);
    setError(null);
    try {
      const [slaRes, deptRes] = await Promise.all([
        adminApi.getSLAMonitoringData({
          departmentId: departmentFilter || undefined,
          priority: priorityFilter || undefined,
          status: statusFilter || undefined,
        }),
        refApi.getDepartments().catch(() => []),
      ]);
      setData(slaRes || { stats: {}, items: [] });
      setDepartments(deptRes || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load SLA compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSLAMonitoring();
  }, [departmentFilter, priorityFilter, statusFilter]);

  const stats = data?.stats || {
    total: 0,
    breachedCount: 0,
    atRiskCount: 0,
    onTrackCount: 0,
    metCount: 0,
    complianceRate: 100,
  };

  const items = data?.items || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
            Citizen Charter & Compliance Enforcement
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Service Level Agreement (SLA) Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live automated tracking of resolution deadlines, countdown clocks, overdue escalations, and SLA breach risk scoring.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
          <p className="text-xs uppercase text-slate-300 font-semibold">SLA Health Score</p>
          <p className={`text-2xl font-black font-display mt-0.5 ${stats.complianceRate >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.complianceRate}%
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchSLAMonitoring} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="SLA Breached"
          value={stats.breachedCount}
          subtitle="Target window exceeded"
          icon={AlertTriangle}
          color="rose"
        />

        <StatCard
          title="At Risk (< 24h Left)"
          value={stats.atRiskCount}
          subtitle="Urgent officer follow-up"
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="On Track"
          value={stats.onTrackCount}
          subtitle="Within compliance window"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Target Met / Closed"
          value={stats.metCount}
          subtitle="Resolved within standard"
          icon={ShieldCheck}
          color="blue"
        />
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          Filter SLA Queue
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.defaultSlaHours}h SLA)
              </option>
            ))}
          </Select>

          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical (24h)</option>
            <option value="high">High (48h)</option>
            <option value="medium">Medium (72h)</option>
            <option value="low">Low (120h)</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Open Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
        </div>
      </Card>

      {/* SLA Queue Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader
          title="SLA Risk & Escalation Radar"
          subtitle="Ranked by calculated urgency and SLA breach probability"
        />

        <CardBody className="p-0">
          {loading ? (
            <div className="p-12">
              <LoadingSpinner size="md" text="Evaluating live SLA countdowns..." />
            </div>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-500">
              🎉 Outstanding! Zero complaints match the selected filter criteria.
            </p>
          ) : (
            <Table>
              <TableHead>
                <TableRow hover={false}>
                  <TableCell header>Ticket & Title</TableCell>
                  <TableCell header>Department / Ward</TableCell>
                  <TableCell header>Priority</TableCell>
                  <TableCell header>Target Window</TableCell>
                  <TableCell header>SLA Status & Deadline</TableCell>
                  <TableCell header className="text-right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((g) => (
                  <TableRow
                    key={g._id}
                    onClick={() => window.location.href = `/admin/grievances/${g._id}`}
                  >
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {g.ticketId}
                          </span>
                          <StatusBadge status={g.status} />
                        </div>
                        <p className="font-bold text-slate-900 text-sm hover:text-blue-600 truncate max-w-xs">
                          {g.title}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-700">
                      <p className="font-semibold">{g.department?.name || 'Department'}</p>
                      <span className="text-slate-400 text-[11px]">{g.ward?.name || 'Ward'}</span>
                    </TableCell>

                    <TableCell>
                      <PriorityBadge priority={g.priority} score={g.priorityScore} />
                    </TableCell>

                    <TableCell className="text-xs font-mono">
                      <div className="space-y-0.5">
                        <span>{g.elapsedHours}h elapsed / {g.hoursAllocated}h max</span>
                        <p className="text-[10px] text-slate-400">
                          Due: {new Date(g.predictedDueAt).toLocaleDateString()} {new Date(g.predictedDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {g.slaStatus === 'breached' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Breached ({Math.abs(g.hoursRemaining)}h overdue)
                        </span>
                      ) : g.slaStatus === 'at_risk' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          At Risk ({g.hoursRemaining}h left)
                        </span>
                      ) : g.slaStatus === 'met' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          SLA Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          On Track ({g.hoursRemaining}h left)
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        to={`/admin/grievances/${g._id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Inspect &rarr;
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
