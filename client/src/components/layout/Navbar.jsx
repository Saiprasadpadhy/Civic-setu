import { Link } from 'react-router-dom';
import { APP_NAME, ROUTES } from '../../constants';

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="text-xl font-bold text-civic-700">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to={ROUTES.LOGIN}
            className="text-sm font-medium text-gray-600 hover:text-civic-600"
          >
            Login
          </Link>
          <Link
            to={ROUTES.REGISTER}
            className="rounded-lg bg-civic-600 px-4 py-2 text-sm font-medium text-white hover:bg-civic-700"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
