import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES } from '../../constants';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Vote,
  User,
  CheckCircle2,
  BarChart3,
  MapPin,
  Clock,
  Building2,
  Calculator,
  Shield,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { user, isCitizen, isOfficer, isAdmin } = useAuth();
  const location = useLocation();

  const citizenNav = [
    { label: 'Overview', to: ROUTES.CITIZEN_DASHBOARD, icon: LayoutDashboard },
    { label: 'Submit Grievance', to: ROUTES.CITIZEN_SUBMIT_GRIEVANCE, icon: PlusCircle, highlight: true },
    { label: 'My Grievances', to: ROUTES.CITIZEN_MY_GRIEVANCES, icon: FolderOpen },
    { label: 'Public Works & Voting', to: ROUTES.CITIZEN_PUBLIC_WORKS, icon: Vote },
    { label: 'My Profile', to: ROUTES.CITIZEN_PROFILE, icon: User },
  ];

  const officerNav = [
    { label: 'Officer Dashboard', to: ROUTES.OFFICER_DASHBOARD, icon: LayoutDashboard },
    { label: 'Assigned Grievances', to: ROUTES.OFFICER_GRIEVANCES, icon: FolderOpen },
  ];

  const adminNav = [
    { label: 'Executive Dashboard', to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { label: 'All Grievances', to: ROUTES.ADMIN_GRIEVANCES, icon: FileSpreadsheet },
    { label: 'Analytics & Insights', to: ROUTES.ADMIN_ANALYTICS, icon: BarChart3 },
    { label: 'Ward Heatmap', to: ROUTES.ADMIN_WARD_HEATMAP, icon: MapPin },
    { label: 'SLA Monitoring', to: ROUTES.ADMIN_SLA_MONITORING, icon: Clock },
    { label: 'Departments', to: ROUTES.ADMIN_DEPARTMENTS, icon: Building2 },
    { label: 'Budget Simulation', to: ROUTES.ADMIN_PUBLIC_WORKS, icon: Calculator },
  ];

  const navItems = isAdmin ? adminNav : isOfficer ? officerNav : citizenNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 bg-white/95 backdrop-blur-md p-4 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-6">
            {/* User role banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                {isAdmin ? '🛡️ Administrator Portal' : isOfficer ? '👮 Officer Portal' : '👤 Citizen Portal'}
              </p>
              <p className="text-sm font-bold text-white mt-1 font-display truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>

            {/* Navigation items */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                      ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : item.highlight
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom badge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[11px] font-bold text-slate-700">CivicSetu Smart City Engine</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Connected to Metro Hub</p>
          </div>
        </div>
      </aside>
    </>
  );
}
