import { useAuth } from '../../auth/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { User, Mail, Shield, Phone, MapPin, Calendar, LogOut } from 'lucide-react';

export function CitizenProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          Account Settings
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          Citizen Profile
        </h1>
      </div>

      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold font-display shadow-md">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="primary" size="sm" className="uppercase font-bold tracking-wider">
                {user?.role || 'Citizen'}
              </Badge>
              <Badge variant="success" size="sm">
                Active Account
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Registered Email
            </span>
            <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </span>
            <p className="text-sm font-semibold text-slate-800">{user?.phone || 'Not provided'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Auth Role
            </span>
            <p className="text-sm font-semibold text-slate-800 capitalize">{user?.role || 'Citizen'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Member Since
            </span>
            <p className="text-sm font-semibold text-slate-800">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Need to update your ward or contact details? Contact municipal administration.
          </p>
          <Button variant="danger" size="sm" onClick={logout} icon={LogOut}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
