import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants';
import { Layout, DashboardLayout } from './components/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitGrievancePage from './pages/citizen/SubmitGrievancePage';
import MyGrievancesPage from './pages/citizen/MyGrievancesPage';
import CitizenGrievanceDetailPage from './pages/citizen/CitizenGrievanceDetailPage';
import { CitizenPublicWorksPage } from './pages/citizen/CitizenPublicWorksPage';
import { CitizenProfilePage } from './pages/citizen/CitizenProfilePage';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerGrievanceQueuePage from './pages/officer/OfficerGrievanceQueuePage';
import OfficerGrievanceDetailPage from './pages/officer/OfficerGrievanceDetailPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAllGrievancesPage from './pages/admin/AdminAllGrievancesPage';
import AdminGrievanceDetailPage from './pages/admin/AdminGrievanceDetailPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminWardHeatmapPage from './pages/admin/AdminWardHeatmapPage';
import AdminSLAMonitoringPage from './pages/admin/AdminSLAMonitoringPage';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import AdminPublicWorksPage from './pages/admin/AdminPublicWorksPage';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path={ROUTES.HOME}
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />
      <Route
        path={ROUTES.LOGIN}
        element={
          <Layout>
            <LoginPage />
          </Layout>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <Layout>
            <RegisterPage />
          </Layout>
        }
      />

      {/* Citizen Routes */}
      <Route
        path={ROUTES.CITIZEN_DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['citizen']}>
              <DashboardLayout>
                <CitizenDashboard />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CITIZEN_SUBMIT_GRIEVANCE}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['citizen']}>
              <DashboardLayout>
                <SubmitGrievancePage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CITIZEN_MY_GRIEVANCES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['citizen']}>
              <DashboardLayout>
                <MyGrievancesPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CITIZEN_GRIEVANCE_DETAIL}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['citizen']}>
              <DashboardLayout>
                <CitizenGrievanceDetailPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CITIZEN_PUBLIC_WORKS}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['citizen']}>
              <DashboardLayout>
                <CitizenPublicWorksPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CITIZEN_PROFILE}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['citizen']}>
              <DashboardLayout>
                <CitizenProfilePage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Officer Routes */}
      <Route
        path={ROUTES.OFFICER_DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['officer', 'admin']}>
              <DashboardLayout>
                <OfficerDashboard />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.OFFICER_GRIEVANCES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['officer', 'admin']}>
              <DashboardLayout>
                <OfficerGrievanceQueuePage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.OFFICER_GRIEVANCE_DETAIL}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['officer', 'admin']}>
              <DashboardLayout>
                <OfficerGrievanceDetailPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path={ROUTES.ADMIN_DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_GRIEVANCES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminAllGrievancesPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_GRIEVANCE_DETAIL}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminGrievanceDetailPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_ANALYTICS}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminAnalyticsPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_WARD_HEATMAP}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminWardHeatmapPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_SLA_MONITORING}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminSLAMonitoringPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_DEPARTMENTS}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminDepartmentsPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_PUBLIC_WORKS}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminPublicWorksPage />
              </DashboardLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
