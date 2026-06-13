import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';
import { useAuth } from '../../context/useAuth';
import * as authService from '../../services/authService';
import { storePendingVerification } from '../../utils/authStorage';
import { roleHome } from '../../utils/roleRedirect';
import '../../css/auth/auth.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) return <Navigate to={roleHome(user?.role)} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(form);
      if (loggedInUser.role.toLowerCase() !== 'cashier') {
        logout();
        setError('Access denied. This portal is reserved for Cashiers only.');
        return;
      }
      navigate(location.state?.from?.pathname || roleHome(loggedInUser.role), { replace: true });
    } catch (requestError) {
      if (requestError.response?.data?.requires_verification) {
        storePendingVerification({ email: requestError.response.data.email });
        navigate('/verify-otp', { replace: true, state: { email: requestError.response.data.email } });
        return;
      }
      setError(requestError.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout mode="login">
        <div className="auth-card__heading"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your cafe</h2><p>Enter your details to continue to your workspace.</p></div>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <FormField label="Email address" icon={Mail} type="email" placeholder="you@cafe.com" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <FormField label="Password" icon={LockKeyhole} type="password" placeholder="Enter your password" autoComplete="current-password" required minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="auth-form__options"><label><input type="checkbox" /> Remember me</label><button type="button" className="text-button" onClick={() => setIsForgotPasswordOpen(true)}>Forgot password?</button></div>
          <button className="primary-button" disabled={loading}>{loading ? <LoadingSpinner label="Signing in..." /> : 'Sign in'}</button>
        </form>
        <p className="auth-switch">New to Velluto Cafe? <Link to="/signup">Create an account</Link></p>
        <p className="auth-legal">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
      </AuthLayout>
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} apiService={authService} />
    </>
  );
}
