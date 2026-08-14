import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Input, Button } from '../components/ui';
import { ROUTES } from '../constants';
import { useAuth } from '../auth/AuthContext';

function getErrorMessage(error) {
  return error.response?.data?.message ?? 'Registration failed. Please try again.';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card title="Register">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Input
            label="Full Name"
            id="name"
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={2}
          />
          <Input
            label="Email"
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-civic-600 hover:text-civic-700">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
