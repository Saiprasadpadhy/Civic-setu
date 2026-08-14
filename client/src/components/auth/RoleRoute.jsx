import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ROUTES } from '../../constants';

export function RoleRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Verifying permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    // Redirect user to their appropriate role home
    if (user?.role === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (user?.role === 'officer') return <Navigate to={ROUTES.OFFICER_DASHBOARD} replace />;
    return <Navigate to={ROUTES.CITIZEN_DASHBOARD} replace />;
  }

  return children;
}
