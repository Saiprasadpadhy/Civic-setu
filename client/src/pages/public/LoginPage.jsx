import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES } from '../../constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login({ email, password });
      const user = res.data?.user || res.user;

      if (from) {
        navigate(from, { replace: true });
      } else if (user?.role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else if (user?.role === 'officer') {
        navigate(ROUTES.OFFICER_DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.CITIZEN_DASHBOARD, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md shadow-blue-500/20 mb-3 font-display">
            CS
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Sign In to CivicSetu</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access citizen reporting, officer dispatch, or admin intelligence
          </p>
        </div>

        {/* Demo Quick-Fill Pill Selectors */}
        <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200 text-xs">
          <p className="font-semibold text-slate-600 mb-2 text-[11px] uppercase tracking-wider text-center">
            🚀 Quick-Fill Test Credentials
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('citizenA@test.com', 'Test@123')}
              className="p-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 font-medium text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Citizen
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('officer@test.com', 'Test@123')}
              className="p-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-medium text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Officer
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin@test.com', 'Test@123')}
              className="p-1.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 text-slate-700 font-medium text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Admin
            </button>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 bg-white border-slate-200/80 shadow-md">
          {error && <ErrorAlert message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to={ROUTES.REGISTER} className="font-bold text-blue-600 hover:underline">
            Register as Citizen
          </Link>
        </p>
      </div>
    </div>
  );
}
