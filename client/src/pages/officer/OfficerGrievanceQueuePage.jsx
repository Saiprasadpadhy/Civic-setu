import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as officerApi from '../../api/officer';
import { ROUTES, STATUS_CONFIG } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  Search,
  Filter,
  Briefcase,
  Layers,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function OfficerGrievanceQueuePage() {
  const [scope, setScope] = useState('department'); // 'assigned' or 'department'
  const [grievances, setGrievances] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await officerApi.getOfficerGrievances({
        scope,
        page,
        limit,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search.trim() || undefined,
      });
      setGrievances(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load officer queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [scope, page, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          Field Dispatch Roster
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          Officer Grievance Queue ({total})
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage department grievances, transition status, upload field evidence, and resolve complaints
        </p>
      </div>

      {/* Scope Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setScope('assigned');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            scope === 'assigned'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Assigned to Me
        </button>

        <button
          type="button"
          onClick={() => {
            setScope('department');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            scope === 'department'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Entire Department Pool
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchQueue} />}

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <Input
              placeholder="Search ticket, title, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>

          <div className="sm:col-span-2 flex items-center">
            <Button type="submit" variant="outline" size="md" className="w-full">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading officer queue..." />
      ) : grievances.length === 0 ? (
        <EmptyState
          title="No grievances found in this queue"
          description="Try changing the scope or clearing your status filters."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableCell header>Ticket ID & Title</TableCell>
                <TableCell header>Ward</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Priority</TableCell>
                <TableCell header>Citizen</TableCell>
                <TableCell header className="text-right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grievances.map((g) => (
                <TableRow
                  key={g._id}
                  onClick={() => window.location.href = `/officer/grievances/${g._id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {g.ticketId}
                      </span>
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-600">
                        {g.title}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-medium text-slate-700">
                    {g.wardId?.name} ({g.wardId?.code})
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={g.status} />
                  </TableCell>

                  <TableCell>
                    <PriorityBadge priority={g.priority} score={g.priorityScore} />
                  </TableCell>

                  <TableCell className="text-xs text-slate-500">
                    {g.citizenId?.name || 'Citizen'}
                  </TableCell>

                  <TableCell className="text-right">
                    <Link
                      to={`/officer/grievances/${g._id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Inspect & Resolve &rarr;
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
