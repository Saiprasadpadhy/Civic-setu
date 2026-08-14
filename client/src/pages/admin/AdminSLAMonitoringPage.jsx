import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AdminSLAMonitoringPage() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getAdminGrievances({ limit: 100 })
      .then((res) => setGrievances(res.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Analyzing SLA turnaround compliance..." />;
  }

  const now = Date.now();
  const unclosed = grievances.filter((g) => !['resolved', 'closed'].includes(g.status));

  // Determine SLA status for each unclosed ticket
  const enriched = unclosed.map((g) => {
    const defaultHours = g.departmentId?.defaultSlaHours || 72;
    const createdAtMs = new Date(g.createdAt).getTime();
    const elapsedHours = Math.round((now - createdAtMs) / (1000 * 60 * 60));
    const hoursRemaining = defaultHours - elapsedHours;
    const isBreached = hoursRemaining < 0;
    const isAtRisk = hoursRemaining >= 0 && hoursRemaining < 24;

    return {
      ...g,
      defaultHours,
      elapsedHours,
      hoursRemaining,
      isBreached,
      isAtRisk,
    };
  });

  const breachedTickets = enriched.filter((g) => g.isBreached);
  const atRiskTickets = enriched.filter((g) => g.isAtRisk);
  const onTrackTickets = enriched.filter((g) => !g.isBreached && !g.isAtRisk);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          Service Level Agreement Enforcement
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          SLA Monitoring & Compliance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time tracking of at-risk tickets, department SLA targets, and breached resolution windows
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="SLA Breached"
          value={breachedTickets.length}
          subtitle="Target window exceeded"
          icon={AlertTriangle}
          color="rose"
        />

        <StatCard
          title="At Risk (< 24h Left)"
          value={atRiskTickets.length}
          subtitle="Urgent officer follow-up"
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="On Track"
          value={onTrackTickets.length}
          subtitle="Within compliance window"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Breached / At Risk Queue Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader
          title="High-Priority SLA Escalation Radar"
          subtitle="Tickets requiring immediate supervisory intervention"
        />

        <CardBody className="p-0">
          {enriched.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-500">
              🎉 Outstanding! Zero open tickets are currently pending.
            </p>
          ) : (
            <Table>
              <TableHead>
                <TableRow hover={false}>
                  <TableCell header>Ticket & Title</TableCell>
                  <TableCell header>Department</TableCell>
                  <TableCell header>Priority</TableCell>
                  <TableCell header>Elapsed / Target</TableCell>
                  <TableCell header>SLA Status</TableCell>
                  <TableCell header className="text-right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enriched.map((g) => (
                  <TableRow
                    key={g._id}
                    onClick={() => window.location.href = `/admin/grievances/${g._id}`}
                  >
                    <TableCell>
                      <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded mr-2">
                        {g.ticketId}
                      </span>
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-600">
                        {g.title}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-medium text-slate-700">
                      {g.departmentId?.name || 'Department'}
                    </TableCell>

                    <TableCell>
                      <PriorityBadge priority={g.priority} score={g.priorityScore} />
                    </TableCell>

                    <TableCell className="text-xs font-mono">
                      {g.elapsedHours}h / {g.defaultHours}h
                    </TableCell>

                    <TableCell>
                      {g.isBreached ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Breached ({Math.abs(g.hoursRemaining)}h overdue)
                        </span>
                      ) : g.isAtRisk ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          {g.hoursRemaining}h remaining
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
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
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
