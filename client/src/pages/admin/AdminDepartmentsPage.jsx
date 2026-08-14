import { useState, useEffect } from 'react';
import * as refApi from '../../api/reference';
import * as adminApi from '../../api/admin';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Building2, Clock, Mail, Users, Shield, CheckCircle2 } from 'lucide-react';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      refApi.getDepartments().catch(() => []),
      adminApi.getAdminOfficers().catch(() => []),
    ])
      .then(([dRes, oRes]) => {
        setDepartments(dRes);
        setOfficers(oRes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading department configurations..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          Municipal Organization
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          Municipal Departments & SLA Targets
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configured municipal divisions, auto-routed categories, and assigned officers
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const deptOfficers = officers.filter(
            (o) => o.departmentId?._id === dept._id || o.departmentId === dept._id
          );

          return (
            <Card key={dept._id} className="p-6 bg-white border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {dept.code}
                  </span>
                  <Badge variant="success" size="sm">
                    Active Division
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-900 font-display mt-2">
                  {dept.name}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Default SLA Target: <strong className="text-slate-800">{dept.defaultSlaHours} hours</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {dept.contactEmail || 'contact@civicsetu.test'}
                  </p>
                </div>

                {/* Categories Auto-Routed */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Auto-Triage Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(dept.categories || []).map((cat, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Officer Roster */}
              <div className="pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Officers in Department:
                  </span>
                  <strong className="text-slate-900">{deptOfficers.length}</strong>
                </div>

                {deptOfficers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {deptOfficers.map((o) => (
                      <div key={o._id} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-800">{o.name}</span>
                        <span className="text-slate-400">{o.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
