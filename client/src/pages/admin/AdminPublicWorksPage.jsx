import { useState, useEffect } from 'react';
import * as budgetApi from '../../api/budget';
import * as refApi from '../../api/reference';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  Calculator,
  PlusCircle,
  Vote,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Sliders,
  TrendingUp,
  MapPin,
  Building2,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';

export default function AdminPublicWorksPage() {
  const [simulation, setSimulation] = useState(null);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);

  // Budget Simulation Envelope State
  const [budgetEnvelope, setBudgetEnvelope] = useState(2500000); // 25 Lakhs default
  const [wardFilter, setWardFilter] = useState('');

  // Create Project Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWardId, setNewWardId] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newCategory, setNewCategory] = useState('infrastructure');
  const [newCost, setNewCost] = useState('');
  const [creating, setCreating] = useState(false);

  // Run backend budget simulation
  const runSimulation = async (envelope = budgetEnvelope, ward = wardFilter) => {
    setSimulating(true);
    try {
      const res = await budgetApi.simulateBudget({
        budgetEnvelope: Number(envelope),
        wardId: ward || undefined,
      });
      setSimulation(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to simulate budget');
    } finally {
      setSimulating(false);
      setLoading(false);
    }
  };

  const initialLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, dRes] = await Promise.all([
        refApi.getWards().catch(() => []),
        refApi.getDepartments().catch(() => []),
      ]);
      setWards(wRes || []);
      setDepartments(dRes || []);
      if (wRes?.length > 0) setNewWardId(wRes[0]._id);
      if (dRes?.length > 0) setNewDeptId(dRes[0]._id);
      await runSimulation(budgetEnvelope, wardFilter);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load public works data');
      setLoading(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  const handleEnvelopeChange = (newVal) => {
    const val = Number(newVal);
    setBudgetEnvelope(val);
    runSimulation(val, wardFilter);
  };

  const handleWardFilterChange = (newWard) => {
    setWardFilter(newWard);
    runSimulation(budgetEnvelope, newWard);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle || !newCost || !newWardId) return;

    setCreating(true);
    try {
      await budgetApi.createBudgetProject({
        title: newTitle.trim(),
        description: newDesc.trim(),
        wardId: newWardId,
        departmentId: newDeptId || undefined,
        category: newCategory,
        estimatedCost: Number(newCost),
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewCost('');
      runSimulation(budgetEnvelope, wardFilter);
    } catch (err) {
      setError('Creation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVotingStatus = async (projectId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'voting_open' ? 'voting_closed' : 'voting_open';
      await budgetApi.updateBudgetProjectStatus(projectId, { status: nextStatus });
      runSimulation(budgetEnvelope, wardFilter);
    } catch (err) {
      setError('Status update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading participatory budget engine..." />;
  }

  const sim = simulation || {
    availableBudget: budgetEnvelope,
    selectedCost: 0,
    remainingBudget: budgetEnvelope,
    overBudgetAmount: 0,
    isOverBudget: false,
    fundedCount: 0,
    totalProjects: 0,
    totalVotes: 0,
    allocatedProjects: [],
    unallocatedProjects: [],
    voteRanking: [],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
            Municipal Participatory Budgeting
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
            Budget Simulation & Project Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate capital fund distribution strictly calculated by the backend based on citizen vote rankings.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateModalOpen(true)}
          icon={PlusCircle}
        >
          Propose New Project
        </Button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => runSimulation()} />}

      {/* Backend Budget Simulation Controller */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400">
              <Calculator className="w-5 h-5" />
              <h3 className="text-base font-bold text-white font-display">
                Participatory Capital Budget Envelope
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              All calculations (allocated cost, remaining surplus, cutoff limits) are generated by backend simulation.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] uppercase text-slate-400 font-semibold block">Available Budget Envelope</span>
              <p className="text-2xl font-black text-emerald-400 font-display">
                ₹{sim.availableBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Range Slider & Ward Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-8 space-y-2">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Simulated Budget Envelope: <strong>₹{budgetEnvelope.toLocaleString()}</strong></span>
              {simulating && <span className="text-blue-400 text-xs animate-pulse">Calculating on server...</span>}
            </div>
            <input
              type="range"
              min="500000"
              max="5000000"
              step="100000"
              value={budgetEnvelope}
              onChange={(e) => handleEnvelopeChange(e.target.value)}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>₹5,00,000 (5L)</span>
              <span>₹25,00,000 (25L)</span>
              <span>₹50,00,000 (50L)</span>
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Ward Filter</label>
            <select
              value={wardFilter}
              onChange={(e) => handleWardFilterChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Wards (City-wide)</option>
              {wards.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Server Simulation Output Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold">Projects Funded by Votes</span>
            <p className="text-xl font-bold text-white mt-1">
              {sim.fundedCount} of {sim.totalProjects}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold">Allocated Cost</span>
            <p className="text-xl font-bold text-blue-400 mt-1">
              ₹{sim.selectedCost.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold">Remaining Surplus</span>
            <p className={`text-xl font-bold mt-1 ${sim.isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{sim.remainingBudget.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold">Total Citizen Votes</span>
            <p className="text-xl font-bold text-purple-300 mt-1">
              {sim.totalVotes}
            </p>
          </div>
        </div>
      </Card>

      {/* Backend Ranked Project Allocation Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Backend Calculated Vote Ranking & Project Allocations
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Cutoff evaluated based on ₹{sim.availableBudget.toLocaleString()} limit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sim.voteRanking.map((p) => (
            <Card
              key={p._id}
              className={`p-5 border transition-all flex flex-col justify-between ${
                p.isFunded
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-sm'
                  : 'bg-slate-50/60 border-slate-200 opacity-70'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Rank #{p.rank}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      p.isFunded
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.isFunded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Funded by Votes
                      </>
                    ) : (
                      'Budget Cutoff Exceeded'
                    )}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 font-display line-clamp-1">{p.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>

                <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>{p.wardId?.name || 'Ward'}</span>
                  <strong className="text-slate-800 font-bold">₹{(p.estimatedCost || 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-700 flex items-center gap-1">
                    <Vote className="w-3.5 h-3.5" />
                    {p.voteCount || 0} Citizen Votes ({p.votePercentage || 0}%)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium capitalize">{p.category}</span>
                </div>

                {/* Admin Status Switcher */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Voting: <strong className="text-slate-700 capitalize">{p.status || 'proposed'}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={p.status === 'voting_open' ? Lock : Unlock}
                    onClick={() => handleToggleVotingStatus(p._id, p.status)}
                    className="text-xs py-1 h-auto"
                  >
                    {p.status === 'voting_open' ? 'Close Voting' : 'Open Voting'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Propose Project Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Propose Community Public Works Project"
        subtitle="Add a project to the municipal citizen voting ballot"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Project Title *"
            placeholder="e.g. Solar Smart Streetlights Corridor"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Textarea
            label="Description *"
            rows={3}
            placeholder="Explain the proposed improvements, expected public benefit, and scope..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Target Ward *"
              value={newWardId}
              onChange={(e) => setNewWardId(e.target.value)}
              required
            >
              {wards.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Select
              label="Department"
              value={newDeptId}
              onChange={(e) => setNewDeptId(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimated Cost (₹) *"
              type="number"
              placeholder="e.g. 850000"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              required
            />

            <Select
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="infrastructure">Infrastructure</option>
              <option value="water">Water Supply</option>
              <option value="sanitation">Sanitation</option>
              <option value="lighting">Lighting</option>
              <option value="parks">Parks & Recreation</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={creating}>
              Publish to Ballot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
