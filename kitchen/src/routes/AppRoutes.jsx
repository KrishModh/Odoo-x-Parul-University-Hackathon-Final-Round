import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import KitchenDashboardPage from '../pages/kitchen/KitchenDashboardPage';
import NotFoundPage from '../pages/shared/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route element={<ProtectedRoute roles={['kitchen']} />}>
        <Route path="/kitchen" element={<KitchenDashboardPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
