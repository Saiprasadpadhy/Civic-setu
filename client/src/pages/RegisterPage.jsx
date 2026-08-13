import { Link } from 'react-router-dom';
import { Card, Input, Button } from '../components/ui';
import { ROUTES } from '../constants';

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card title="Register">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Full Name" id="name" type="text" placeholder="Your name" />
          <Input label="Email" id="email" type="email" placeholder="you@example.com" />
          <Input label="Password" id="password" type="password" placeholder="••••••••" />
          <Button type="submit" className="w-full">
            Create Account
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
