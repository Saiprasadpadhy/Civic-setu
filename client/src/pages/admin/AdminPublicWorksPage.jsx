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
} from 'lucide-react';

export default function AdminPublicWorksPage() {
  const [projects, setProjects] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Budget Simulation Envelope Slider State
  const [budgetEnvelope, setBudgetEnvelope] = useState(2500000); // 25 Lakhs default

  // Create Project Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWardId, setNewWardId] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newCategory, setNewCategory] = useState('infrastructure');
  const [newCost, setNewCost] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, wRes, dRes] = await Promise.all([
        budgetApi.getBudgetProjects(),
        refApi.getWards().catch(() => []),
        refApi.getDepartments().catch(() => []),
      ]);
      setProjects(pRes);
      setWards(wRes);
      setDepartments(dRes);
      if (wRes.length > 0) setNewWardId(wRes[0]._id);
      if (dRes.length > 0) setNewDeptId(dRes[0]._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load budget projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
    } catch (err) {
      setError('Creation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading participatory budget simulator..." />;
  }

  // Simulation logic: sort projects by votes descending and see which fit in envelope
  const sortedProjects = [...projects].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

  let runningCost = 0;
  const simulatedProjects = sortedProjects.map((p) => {
    const cost = p.estimatedCost || 0;
    if (runningCost + cost <= budgetEnvelope) {
      runningCost += cost;
      return { ...p, isFunded: true, allocatedCost: cost };
    }
    return { ...p, isFunded: false, allocatedCost: 0 };
  });

  const fundedCount = simulatedProjects.filter((p) => p.isFunded).length;
  const remainingBudget = Math.max(0, budgetEnvelope - runningCost);

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
            Simulate dynamic municipal capital allocation based on direct citizen voting
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

      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* Interactive Simulation Controls */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400">
              <Calculator className="w-5 h-5" />
              <h3 className="text-base font-bold text-white font-display">
                Municipal Capital Allocation Envelope
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Adjust the slider to simulate fund cutoff thresholds across citizen-voted projects
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase text-slate-400 font-semibold">Simulated Budget</span>
            <p className="text-2xl font-black text-emerald-400 font-display">
              ₹{budgetEnvelope.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="500000"
            max="5000000"
            step="100000"
            value={budgetEnvelope}
            onChange={(e) => setBudgetEnvelope(Number(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>₹5,00,000 (5L)</span>
            <span>₹25,00,000 (25L)</span>
            <span>₹50,00,000 (50L)</span>
          </div>
        </div>

        {/* Simulation Output Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold">Projects Funded by Citizen Vote</span>
            <p className="text-xl font-bold text-white mt-1">
              {fundedCount} of {projects.length}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold">Allocated Expenditure</span>
            <p className="text-xl font-bold text-blue-400 mt-1">
              ₹{runningCost.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold">Unallocated Surplus</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              ₹{remainingBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Simulated Ranked Projects Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-display">
          Ranked Project Allocation Results
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simulatedProjects.map((p, rank) => (
            <Card
              key={p._id}
              className={`p-5 border transition-all flex flex-col justify-between ${
                p.isFunded
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-sm'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Rank #{rank + 1}
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Funded
                      </>
                    ) : (
                      'Cutoff Exceeded'
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

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-700 flex items-center gap-1">
                  <Vote className="w-3.5 h-3.5" />
                  {p.voteCount || 0} Citizen Votes
                </span>
                <span className="text-[11px] text-slate-500 font-medium capitalize">{p.category}</span>
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
        subtitle="Add a project to the citizen voting ballot"
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
