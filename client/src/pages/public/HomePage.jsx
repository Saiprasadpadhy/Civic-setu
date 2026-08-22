import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES, APP_NAME, APP_TAGLINE } from '../../constants';
import * as refApi from '../../api/reference';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  Brain,
  MapPin,
  Vote,
  Layers,
  Clock,
  ChevronRight,
  Mic,
  Camera,
  Activity,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [ticketSearch, setTicketSearch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    Promise.all([refApi.getDepartments().catch(() => []), refApi.getWards().catch(() => [])])
      .then(([deptRes, wardRes]) => {
        setDepartments(deptRes);
        setWards(wardRes);
      })
      .finally(() => setLoadingStats(false));
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!ticketSearch.trim()) return;
    if (isAuthenticated) {
      navigate(`${ROUTES.CITIZEN_MY_GRIEVANCES}?search=${encodeURIComponent(ticketSearch.trim())}`);
    } else {
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ticketSearch.trim())}`);
    }
  };

  const getDashboardRoute = () => {
    if (role === 'admin') return ROUTES.ADMIN_DASHBOARD;
    if (role === 'officer') return ROUTES.OFFICER_DASHBOARD;
    return ROUTES.CITIZEN_DASHBOARD;
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12">
        <div className="w-full px-3 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-display max-w-4xl mx-auto leading-tight sm:leading-none">
            Evidence-Grounded Civic Triage &{' '}
            <span className="bg-gradient-to-r from-[#0A2540] via-[#1d4674] to-amber-600 bg-clip-text text-transparent">
              Participatory Budgeting
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report civic issues in your native language with voice, photo proof, and pinpoint map locations.
            Powered by Gemini AI for instant categorization, automated department routing, and transparent SLA tracking.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={getDashboardRoute()}>
                <Button size="lg" variant="primary" icon={Layers}>
                  Go to {role?.toUpperCase()} Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.REGISTER}>
                  <Button size="lg" variant="secondary" icon={ArrowRight}>
                    Submit a Complaint as Citizen
                  </Button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <Button size="lg" variant="outline">
                    Sign In to Portal
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Quick Track Grievance Bar */}
          <div className="mt-12 max-w-xl mx-auto">
            <form
              onSubmit={handleTrackSubmit}
              className="p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg flex items-center gap-2"
            >
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g. CS-2026-000001)..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <Button type="submit" variant="primary" size="sm">
                Track Ticket
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Real-time platform numbers from live backend */}
      <section className="w-full px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 text-center bg-white border-slate-200/80 hover:border-amber-500/30 transition-colors shadow-sm">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Wards</p>
            <p className="text-3xl font-extrabold text-[#0A2540] mt-1 font-display">
              {loadingStats ? '...' : wards.length || 3}
            </p>
            <span className="text-[11px] text-teal-700 font-semibold mt-1 inline-block">
              100% Geospatially Mapped
            </span>
          </Card>

          <Card className="p-5 text-center bg-white border-slate-200/80 hover:border-amber-500/30 transition-colors shadow-sm">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Connected Depts</p>
            <p className="text-3xl font-extrabold text-[#173a60] mt-1 font-display">
              {loadingStats ? '...' : departments.length || 3}
            </p>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 inline-block">
              Roads, Water, Sanitation
            </span>
          </Card>

          <Card className="p-5 text-center bg-white border-slate-200/80 hover:border-amber-500/30 transition-colors shadow-sm">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">AI Intelligence</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1 font-display">Gemini AI</p>
            <span className="text-[11px] text-[#173a60] font-semibold mt-1 inline-block">
              Multilingual & Vision Grounded
            </span>
          </Card>

          <Card className="p-5 text-center bg-white border-slate-200/80 hover:border-amber-500/30 transition-colors shadow-sm">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">SLA Target</p>
            <p className="text-3xl font-extrabold text-teal-700 mt-1 font-display">48-96h</p>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
              Evidence-Based Resolution
            </span>
          </Card>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="w-full px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
            Next-Generation Civic Infrastructure
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Built from the ground up for citizens, field officers, and city administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="p-6 bg-white border-slate-200/80 hover:border-amber-500/30 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              AI-Powered Triage
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Instant grievance classification, semantic priority scoring, language normalization (English, Hindi, Odia), and duplicate detection before dispatching.
            </p>
          </Card>

          {/* Card 2 */}
          <Card className="p-6 bg-white border-slate-200/80 hover:border-amber-500/30 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0A2540] border border-slate-200 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Evidence-Grounded Resolution
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Field officers must upload verified 'after-repair' photo evidence and notes before closing complaints, subject to citizen confirmation.
            </p>
          </Card>

          {/* Card 3 */}
          <Card className="p-6 bg-white border-slate-200/80 hover:border-amber-500/30 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center mb-4">
              <Vote className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Participatory Budgeting
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Citizens directly vote on ward community development projects. Administrators simulate municipal fund allocation based on real public priority.
            </p>
          </Card>
        </div>
      </section>

      {/* Workflow Step Explainer */}
      <section className="bg-slate-900 text-white py-16 rounded-3xl mx-3 sm:mx-6 lg:mx-8 px-4 sm:px-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Transparent Lifecycle
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white mt-2">
              From Citizen Report to Verified Resolution
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Citizen Reports</h4>
              <p className="text-xs text-slate-400 mt-1">Photo, Voice & Map Location</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-white">AI Categorizes</h4>
              <p className="text-xs text-slate-400 mt-1">Severity & Ward Auto-Routing</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Officer Resolves</h4>
              <p className="text-xs text-slate-400 mt-1">Field repair & Evidence upload</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                4
              </div>
              <h4 className="font-bold text-sm text-white">Citizen Closes</h4>
              <p className="text-xs text-slate-400 mt-1">Verified Resolution confirmation</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
