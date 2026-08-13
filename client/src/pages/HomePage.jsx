import { useState } from 'react';
import { Link } from 'react-router-dom';
import { checkHealth } from '../api/health';
import { Button, Card } from '../components/ui';
import { ROUTES } from '../constants';

export default function HomePage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleHealthCheck() {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setError('Unable to reach the API. Is the server running?');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Civic Grievance Management
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Evidence-grounded civic grievance triage and participatory budgeting platform.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to={ROUTES.REGISTER}>
            <Button size="lg">Get Started</Button>
          </Link>
          <Button variant="secondary" size="lg" onClick={handleHealthCheck} disabled={loading}>
            {loading ? 'Checking...' : 'Check API Health'}
          </Button>
        </div>
      </div>

      {(health || error) && (
        <div className="mx-auto mt-10 max-w-md">
          <Card title="API Status">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {health && (
              <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
                {JSON.stringify(health, null, 2)}
              </pre>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
