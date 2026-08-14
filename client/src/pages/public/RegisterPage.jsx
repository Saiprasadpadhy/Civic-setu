import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES } from '../../constants';
import * as refApi from '../../api/reference';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [wardId, setWardId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    refApi.getWards().then((res) => {
      setWards(res);
      if (res.length > 0) setWardId(res[0]._id);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        name,
        email,
        password,
        phone: phone.trim() || undefined,
        wardId: wardId || undefined,
      });
      navigate(ROUTES.CITIZEN_DASHBOARD, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md shadow-blue-500/20 mb-3 font-display">
            CS
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Citizen Registration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an account to report civic issues and participate in ward budget voting
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 bg-white border-slate-200/80 shadow-md">
          {error && <ErrorAlert message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Full Name *"
              placeholder="e.g. Priyanshu Das"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              required
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={Phone}
            />

            {wards.length > 0 && (
              <Select
                label="Home Ward"
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
              >
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code}) - {w.city}
                  </option>
                ))}
              </Select>
            )}

            <div className="relative">
              <Input
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
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

            <Input
              label="Confirm Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to={ROUTES.LOGIN} className="font-bold text-blue-600 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
