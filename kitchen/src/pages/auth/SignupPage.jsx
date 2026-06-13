import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, Store, UserRound } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/useAuth';
import { storePendingVerification } from '../../utils/authStorage';
import { roleHome } from '../../utils/roleRedirect';
import '../../css/auth/auth.css';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', cafe_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to={roleHome(user?.role)} replace />;

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await signup({ ...form, role: 'kitchen' });
      storePendingVerification({ email: response.email });
      navigate('/verify-otp', { replace: true, state: { email: response.email, resendAvailableIn: response.resend_available_in } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="signup">
      <div className="auth-card__heading">
        <span className="eyebrow">GET STARTED</span>
        <h2>Create Kitchen Account</h2>
        <p>Set up your kitchen account to view and process cafe orders.</p>
      </div>
      {error && <div className="form-alert" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form auth-form--compact">
        <div className="form-grid">
          <FormField label="Your name" icon={UserRound} placeholder="Alex Morgan" required value={form.name} onChange={update('name')} />
          <FormField label="Cafe name" icon={Store} placeholder="Velluto Cafe" required value={form.cafe_name} onChange={update('cafe_name')} />
        </div>
        <FormField label="Work email" icon={Mail} type="email" placeholder="you@cafe.com" autoComplete="email" required value={form.email} onChange={update('email')} />
        <FormField label="Password" icon={LockKeyhole} type="password" placeholder="At least 8 characters" autoComplete="new-password" required minLength="8" value={form.password} onChange={update('password')} />
        <label className="terms-check"><input type="checkbox" required /><span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span></label>
        <button className="primary-button" disabled={loading}>{loading ? <LoadingSpinner label="Creating account..." /> : 'Create Account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
