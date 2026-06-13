import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ roles = [] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);
  console.log('[ProtectedRoute] user:', user);
  console.log('[ProtectedRoute] required roles:', roles);

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (!user || !user.role) {
    console.warn('[ProtectedRoute] User or role is missing! Clearing session and redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ensure role comparison is case-insensitive just in case
  const userRole = user.role.toLowerCase();
  const allowedRoles = roles.map(r => r.toLowerCase());

  console.log('[ProtectedRoute] checking if userRole', userRole, 'is in allowedRoles', allowedRoles);

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    console.warn(`[ProtectedRoute] Role mismatch. User has ${userRole}, route requires ${allowedRoles.join(',')}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
