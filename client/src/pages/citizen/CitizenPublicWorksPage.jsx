import { useState, useEffect } from 'react';
import * as budgetApi from '../../api/budget';
import * as refApi from '../../api/reference';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  Vote,
  ThumbsUp,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export function CitizenPublicWorksPage() {
  const [projects, setProjects] = useState([]);
  const [wards, setWards] = useState([]);
  const [wardFilter, setWardFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, wardRes] = await Promise.all([
        budgetApi.getBudgetProjects({ wardId: wardFilter || undefined }),
        refApi.getWards().catch(() => []),
      ]);
      setProjects(projRes);
      setWards(wardRes);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load public works projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [wardFilter]);

  const handleVote = async (id) => {
    setVotingId(id);
    try {
      const res = await budgetApi.voteOnBudgetProject(id);
      setProjects((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                voteCount: res.data?.project?.voteCount ?? (p.hasVoted ? p.voteCount - 1 : p.voteCount + 1),
                hasVoted: res.data?.hasVoted,
              }
            : p
        )
      );
    } catch (err) {
      setError('Voting failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setVotingId(null);
    }
  };

  const totalVotesAll = projects.reduce((sum, p) => sum + (p.voteCount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-purple-200">
            Direct Democracy & Participatory Budgeting
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Ward Public Works Voting
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-xl">
            Vote on proposed infrastructure, sanitation, and safety upgrades in your ward. The city municipal budget allocates funding directly based on citizen votes.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
          <p className="text-xs uppercase text-purple-200 font-semibold">Total Citizen Votes</p>
          <p className="text-2xl font-black text-white font-display mt-0.5">{totalVotesAll}</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPin className="w-4 h-4 text-blue-600" />
          Filter by Ward
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
          >
            <option value="">All Wards (City-wide)</option>
            {wards.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading community projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No proposed projects in this ward yet"
          description="Check back soon or select another ward to participate in budget voting."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const hasVoted = project.hasVoted;
            const percentage = totalVotesAll > 0 ? Math.round((project.voteCount / totalVotesAll) * 100) : 0;

            return (
              <Card
                key={project._id}
                className="p-6 bg-white border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                      {project.category || 'Infrastructure'}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                      ₹{(project.estimatedCost || 0).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-display line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  <div className="pt-2 text-xs text-slate-400 space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {project.wardId?.name || 'Local Ward'}
                    </div>
                    {project.departmentId?.name && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {project.departmentId.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Voting & Progress */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {project.voteCount} vote{project.voteCount === 1 ? '' : 's'}
                    </span>
                    <span className="text-purple-600 font-bold">{percentage}% support</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>

                  <Button
                    variant={hasVoted ? 'success' : 'primary'}
                    size="sm"
                    loading={votingId === project._id}
                    onClick={() => handleVote(project._id)}
                    icon={hasVoted ? CheckCircle2 : ThumbsUp}
                    className="w-full mt-2"
                  >
                    {hasVoted ? 'Voted (Click to Withdraw)' : 'Vote for this Project'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
