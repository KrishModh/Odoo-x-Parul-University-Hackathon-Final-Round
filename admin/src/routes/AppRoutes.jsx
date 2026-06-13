import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import NotFoundPage from '../pages/shared/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/reports" element={<AdminDashboardPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
