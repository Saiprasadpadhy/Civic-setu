import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES, APP_NAME, LANGUAGES } from '../../constants';
import { Button } from '../ui/Button';
import {
  Menu,
  X,
  Shield,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  PlusCircle,
  Vote,
  FileText,
  Layers,
  BarChart3,
  Map,
} from 'lucide-react';

export function Navbar({ onToggleSidebar, showSidebarToggle = false }) {
  const { user, isAuthenticated, logout, role, isCitizen, isOfficer, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const getDashboardLink = () => {
    if (isAdmin) return ROUTES.ADMIN_DASHBOARD;
    if (isOfficer) return ROUTES.OFFICER_DASHBOARD;
    return ROUTES.CITIZEN_DASHBOARD;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform font-display">
              CS
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-display">
                {APP_NAME}
              </span>
              <span className="text-[10px] -mt-1 text-slate-400 font-medium tracking-wide">
                Govtech Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Center navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to={ROUTES.HOME}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              location.pathname === ROUTES.HOME
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Home
          </Link>

          {isAuthenticated && (
            <Link
              to={getDashboardLink()}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                location.pathname.includes('/dashboard')
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </Link>
          )}

          {isCitizen && (
            <>
              <Link
                to={ROUTES.CITIZEN_SUBMIT_GRIEVANCE}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Submit Grievance
              </Link>
              <Link
                to={ROUTES.CITIZEN_PUBLIC_WORKS}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1"
              >
                <Vote className="w-3.5 h-3.5 text-indigo-500" />
                Public Works
              </Link>
            </>
          )}

          {isOfficer && (
            <Link
              to={ROUTES.OFFICER_GRIEVANCES}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Assigned Queue
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                to={ROUTES.ADMIN_GRIEVANCES}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                All Grievances
              </Link>
              <Link
                to={ROUTES.ADMIN_ANALYTICS}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Analytics
              </Link>
            </>
          )}
        </nav>

        {/* Right action items */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center text-xs font-bold font-display">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                  <span className="text-[10px] font-semibold text-blue-600 capitalize">
                    {role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200/80 z-30 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <Layers className="w-4 h-4 text-blue-500" />
                        Dashboard
                      </Link>

                      {isCitizen && (
                        <Link
                          to={ROUTES.CITIZEN_PROFILE}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          My Profile
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2">
          <Link
            to={ROUTES.HOME}
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardLink()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>
          )}
          {isCitizen && (
            <>
              <Link
                to={ROUTES.CITIZEN_SUBMIT_GRIEVANCE}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50"
              >
                Submit Grievance
              </Link>
              <Link
                to={ROUTES.CITIZEN_PUBLIC_WORKS}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Public Works
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
