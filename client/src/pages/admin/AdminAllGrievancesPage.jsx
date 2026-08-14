import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import * as refApi from '../../api/reference';
import { ROUTES, STATUS_CONFIG } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  Search,
  UserPlus,
  ShieldAlert,
  Sparkles,
  MapPin,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';

export default function AdminAllGrievancesPage() {
  const [grievances, setGrievances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [officers, setOfficers] = useState([]);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [wardId, setWardId] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assign Officer Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Status Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('in_progress');
  const [overrideNote, setOverrideNote] = useState('');
  const [overriding, setOverriding] = useState(false);

  const fetchFiltersData = async () => {
    try {
      const [dRes, wRes, oRes] = await Promise.all([
        refApi.getDepartments().catch(() => []),
        refApi.getWards().catch(() => []),
        adminApi.getAdminOfficers().catch(() => []),
      ]);
      setDepartments(dRes);
      setWards(wRes);
      setOfficers(oRes);
      if (oRes.length > 0) setSelectedOfficerId(oRes[0]._id);
    } catch {}
  };

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAdminGrievances({
        page,
        limit,
        status: status || undefined,
        departmentId: departmentId || undefined,
        wardId: wardId || undefined,
        priority: priority || undefined,
        search: search.trim() || undefined,
      });
      setGrievances(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load master grievances table');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchGrievances();
  }, [page, status, departmentId, wardId, priority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGrievances();
  };

  const handleOpenAssignModal = (g, e) => {
    e.stopPropagation();
    setSelectedGrievance(g);
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrievance || !selectedOfficerId) return;

    setAssigning(true);
    try {
      await adminApi.assignGrievanceOfficer(selectedGrievance._id, selectedOfficerId);
      setAssignModalOpen(false);
      fetchGrievances();
    } catch (err) {
      setError('Assignment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenOverrideModal = (g, e) => {
    e.stopPropagation();
    setSelectedGrievance(g);
    setOverrideStatus(g.status || 'in_progress');
    setOverrideNote('');
    setOverrideModalOpen(true);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    setOverriding(true);
    try {
      await adminApi.overrideAdminGrievanceStatus(selectedGrievance._id, {
        status: overrideStatus,
        note: overrideNote.trim() || 'Admin manual status override',
      });
      setOverrideModalOpen(false);
      fetchGrievances();
    } catch (err) {
      setError('Override failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setOverriding(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          City-Wide Master Directory
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          All Grievances ({total})
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete intake ledger, officer dispatch assignments, and status overrides
        </p>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchGrievances} />}

      {/* Multi-Filter Bar */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Input
              placeholder="Search ticket ID or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          <div className="sm:col-span-2">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
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

          <div className="sm:col-span-2">
            <Select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Select
              value={wardId}
              onChange={(e) => {
                setWardId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Wards</option>
              {wards.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2 flex items-center">
            <Button type="submit" variant="primary" size="md" className="w-full">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Grievances Master Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading grievances master ledger..." />
      ) : grievances.length === 0 ? (
        <EmptyState
          title="No grievances matched your criteria"
          description="Try broadening your department, ward, or status filters."
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
                <TableCell header>Assigned Officer</TableCell>
                <TableCell header className="text-right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grievances.map((g) => (
                <TableRow
                  key={g._id}
                  onClick={() => window.location.href = `/admin/grievances/${g._id}`}
                >
                  <TableCell>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mr-2">
                        {g.ticketId}
                      </span>
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-600">
                        {g.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Citizen: {g.citizenId?.name} ({new Date(g.createdAt).toLocaleDateString()})
                    </p>
                  </TableCell>

                  <TableCell className="text-xs">
                    <p className="font-semibold text-slate-800">{g.wardId?.name}</p>
                    <p className="text-slate-400">{g.departmentId?.name || 'Auto-Routed'}</p>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={g.status} />
                  </TableCell>

                  <TableCell>
                    <PriorityBadge priority={g.priority} score={g.priorityScore} />
                  </TableCell>

                  <TableCell className="text-xs">
                    {g.assignedOfficerId ? (
                      <span className="font-semibold text-slate-800">
                        {g.assignedOfficerId.name}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold italic">Unassigned</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleOpenAssignModal(g, e)}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleOpenOverrideModal(g, e)}
                      >
                        Override
                      </Button>
                    </div>
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

      {/* Assign Officer Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Officer to Grievance"
        subtitle={`Ticket ${selectedGrievance?.ticketId}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select
            label="Select Active Field Officer *"
            value={selectedOfficerId}
            onChange={(e) => setSelectedOfficerId(e.target.value)}
            required
          >
            {officers.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name} ({o.email})
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={assigning}>
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Override Status Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Admin Status Override"
        subtitle={`Ticket ${selectedGrievance?.ticketId} — Override workflow state`}
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4">
          <Select
            label="New Status *"
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value)}
          >
            {Object.keys(STATUS_CONFIG).map((st) => (
              <option key={st} value={st}>
                {STATUS_CONFIG[st].label}
              </option>
            ))}
          </Select>

          <Textarea
            label="Admin Audit Reason / Note *"
            rows={3}
            placeholder="Document the administrative reason for overriding status..."
            value={overrideNote}
            onChange={(e) => setOverrideNote(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="md" loading={overriding}>
              Apply Status Override
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
