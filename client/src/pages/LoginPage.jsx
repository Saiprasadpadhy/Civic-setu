import { Link } from 'react-router-dom';
import { Card, Input, Button } from '../components/ui';
import { ROUTES } from '../constants';

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card title="Login">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Email" id="email" type="email" placeholder="you@example.com" />
          <Input label="Password" id="password" type="password" placeholder="••••••••" />
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-civic-600 hover:text-civic-700">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
