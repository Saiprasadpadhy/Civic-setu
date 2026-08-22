import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as grievanceApi from '../../api/grievances';
import { ROUTES, STATUS_CONFIG } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  Search,
  PlusCircle,
  Filter,
  ArrowUpDown,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function MyGrievancesPage() {
  const [grievances, setGrievances] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceApi.getMyGrievances({
        page,
        limit,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
      });
      setGrievances(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your grievances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [page, statusFilter, categoryFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGrievances();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
            Citizen Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
            My Grievances ({total})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track status transitions, officer assignments, and resolution evidence
          </p>
        </div>

        <Link to={ROUTES.CITIZEN_SUBMIT_GRIEVANCE}>
          <Button variant="primary" size="md" icon={PlusCircle}>
            Submit New Grievance
          </Button>
        </Link>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchGrievances} />}

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Input
              placeholder="Search by ticket or keyword..."
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
              {Object.keys(STATUS_CONFIG).map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="priorityScore-desc">Highest Priority First</option>
            </Select>
          </div>

          <div className="sm:col-span-2 flex items-center">
            <Button type="submit" variant="outline" size="md" className="w-full">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Grievances Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading grievances list..." />
      ) : grievances.length === 0 ? (
        <EmptyState
          title="No grievances matched"
          description="Try adjusting your filters or search keywords."
          actionText="Submit New Grievance"
          onAction={() => window.location.href = ROUTES.CITIZEN_SUBMIT_GRIEVANCE}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableCell header>Ticket & Title</TableCell>
                <TableCell header>Ward & Dept</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Priority</TableCell>
                <TableCell header>Reported On</TableCell>
                <TableCell header className="text-right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grievances.map((g) => (
                <TableRow
                  key={g._id}
                  onClick={() => window.location.href = `/citizen/grievances/${g._id}`}
                >
                  <TableCell>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mr-2">
                        {g.ticketId}
                      </span>
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                        {g.title}
                      </span>
                    </div>
                    {g.aiAnalysis?.summary && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                        {g.aiAnalysis.summary}
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">{g.wardId?.name || 'Ward'}</p>
                      <p className="text-slate-400">{g.departmentId?.name || (g.category === 'invalid' || !g.departmentId ? 'Unassigned / NA' : 'Auto-Routed')}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={g.status} />
                  </TableCell>

                  <TableCell>
                    <PriorityBadge priority={g.priority} score={g.priorityScore} />
                  </TableCell>

                  <TableCell className="text-xs text-slate-500">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-right">
                    <Link
                      to={`/citizen/grievances/${g._id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View &rarr;
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
