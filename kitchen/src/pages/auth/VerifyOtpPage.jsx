import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Mail, RotateCcw } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/useAuth';
import { clearPendingVerification, getPendingVerification, storePendingVerification } from '../../utils/authStorage';
import { roleHome } from '../../utils/roleRedirect';
import '../../css/auth/auth.css';

const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmOtp, requestOtpResend, isAuthenticated, user } = useAuth();
  const pendingVerification = useMemo(() => getPendingVerification(), []);
  const initialEmail = location.state?.email || pendingVerification?.email || '';
  const initialResend = location.state?.resendAvailableIn || 60;
  const inputRefs = useRef([]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(initialResend);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (email) {
      storePendingVerification({ email });
    }
  }, [email]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  if (isAuthenticated) return <Navigate to={roleHome(user?.role)} replace />;

  const code = otp.join('');

  const handleChange = (index, rawValue) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setOtp((current) => current.map((item, itemIndex) => itemIndex === index ? '' : item));
      return;
    }

    const nextOtp = [...otp];
    digits.slice(0, OTP_LENGTH - index).split('').forEach((digit, offset) => {
      nextOtp[index + offset] = digit;
    });
    setOtp(nextOtp);
    inputRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const nextOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((digit, index) => { nextOtp[index] = digit; });
    setOtp(nextOtp);
    inputRefs.current[Math.min(pasted.length - 1, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Enter the email address used during signup.');
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setError('Enter the full 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const response = await confirmOtp({ email, otp_code: code });
      clearPendingVerification();
      setSuccess(response.message || 'Email verified successfully.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify your code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Enter the email address used during signup.');
      return;
    }

    setResending(true);
    try {
      const response = await requestOtpResend({ email });
      setCountdown(response.resend_available_in || 60);
      setOtp(Array(OTP_LENGTH).fill(''));
      setSuccess(response.message || 'A new verification code has been sent.');
    } catch (requestError) {
      const retryAfter = requestError.response?.data?.resend_available_in;
      if (retryAfter) setCountdown(retryAfter);
      setError(requestError.response?.data?.message || 'Unable to resend your code right now.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout mode="verify">
      <div className="auth-card__heading">
        <span className="eyebrow">EMAIL VERIFICATION</span>
        <h2>Enter your 6-digit code</h2>
        <p>We sent a secure verification code to your inbox. Confirm it below to unlock Velluto Kitchen.</p>
      </div>

      {(error || success) && (
        <div className={`form-alert ${success ? 'form-alert--success' : ''}`} role="alert">
          {success ? <CheckCircle2 size={18} /> : <Mail size={18} />}
          <span>{success || error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="auth-form auth-form--compact">
        <label className="form-field">
          <span className="form-field__label">Email address</span>
          <span className="form-field__control">
            <Mail size={18} />
            <input type="email" placeholder="you@cafe.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </span>
        </label>

        <div className="otp-card">
          <div className="otp-card__header">
            <strong>Verification code</strong>
            <small>Expires in 5 minutes</small>
          </div>

          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          <div className="otp-card__footer">
            <span>{countdown > 0 ? `Resend available in ${countdown}s` : 'Didn’t receive a code?'}</span>
            <button type="button" className="text-button" onClick={handleResend} disabled={resending || countdown > 0}>
              {resending ? <LoadingSpinner label="Resending..." /> : <><RotateCcw size={15} />Resend OTP</>}
            </button>
          </div>
        </div>

        <button className="primary-button" disabled={verifying}>
          {verifying ? <LoadingSpinner label="Verifying..." /> : 'Verify'}
        </button>
      </form>

      <p className="auth-switch">Already verified? <Link to="/login">Return to login</Link></p>
    </AuthLayout>
  );
}
