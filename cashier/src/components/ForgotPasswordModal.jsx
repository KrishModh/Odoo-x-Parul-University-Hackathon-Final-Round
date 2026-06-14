import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, LockKeyhole, ArrowLeft } from 'lucide-react';
import FormField from './FormField';
import LoadingSpinner from './LoadingSpinner';

export default function ForgotPasswordModal({ isOpen, onClose, apiService }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiService.forgotPassword({ email });
      setSuccess('Reset OTP sent to your registered email address.');
      setCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiService.verifyResetOtp({ email, otp_code: otp });
      setSuccess('Verification code validated successfully.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword({ email, password });
      setSuccess('Password updated successfully. You can now log in.');
      setTimeout(() => {
        onClose();
        setStep(1);
        setEmail('');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
        setSuccess('');
        setError('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-overlay" style={{ zIndex: 1000 }}>
      <div className="payment-modal" style={{ maxWidth: '440px', padding: '30px', background: '#fffdf9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          {step > 1 && (
            <button 
              type="button" 
              onClick={() => { setStep(step - 1); setError(''); setSuccess(''); }} 
              style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#8a7b70', padding: 0 }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#49352a', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Reset Password
          </h3>
        </div>

        {error && <div className="form-alert" role="alert" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div className="form-alert form-alert--success" role="alert" style={{ marginBottom: '16px', background: '#e3eee8', color: '#3b7d55', borderColor: '#d0e3d7' }}>{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <p style={{ fontSize: '0.88rem', color: '#7f7972', marginBottom: '20px' }}>
              Enter your registered email address and we'll send you a 6-digit OTP code to verify your identity.
            </p>
            <FormField 
              label="Email address" 
              icon={Mail} 
              type="email" 
              placeholder="you@cafe.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="payment-modal__btn--failed"
                onClick={onClose}
                style={{ background: '#eee7df', color: '#49352a', border: 0, borderRadius: '12px', height: '44px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="payment-modal__btn--success"
                disabled={loading || !email}
                style={{ background: '#547662', border: 0, borderRadius: '12px', height: '44px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ fontSize: '0.88rem', color: '#7f7972', marginBottom: '20px' }}>
              We've sent a 6-digit verification code to <strong>{email}</strong>. Enter it below to proceed.
            </p>
            <FormField 
              label="Verification Code (OTP)" 
              icon={ShieldCheck} 
              type="text" 
              placeholder="000000" 
              required 
              maxLength="6"
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.82rem' }}>
              <span style={{ color: '#8a7b70' }}>OTP code expires in 5 mins</span>
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={() => handleSendOtp(null)}
                style={{ border: 0, background: 'transparent', color: cooldown > 0 ? '#b2a496' : '#8b6045', fontWeight: 'bold', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="payment-modal__btn--failed"
                onClick={onClose}
                style={{ background: '#eee7df', color: '#49352a', border: 0, borderRadius: '12px', height: '44px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="payment-modal__btn--success"
                disabled={loading || otp.length !== 6}
                style={{ background: '#547662', border: 0, borderRadius: '12px', height: '44px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: '0.88rem', color: '#7f7972', marginBottom: '20px' }}>
              Reset request verified successfully! Enter your new password details below.
            </p>
            <FormField 
              label="New Password" 
              icon={LockKeyhole} 
              type="password" 
              placeholder="Enter new password" 
              required 
              minLength="8"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <div style={{ marginTop: '12px' }}>
              <FormField 
                label="Confirm Password" 
                icon={LockKeyhole} 
                type="password" 
                placeholder="Confirm new password" 
                required 
                minLength="8"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="payment-modal__btn--failed"
                onClick={onClose}
                style={{ background: '#eee7df', color: '#49352a', border: 0, borderRadius: '12px', height: '44px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="payment-modal__btn--success"
                disabled={loading || !password || !confirmPassword}
                style={{ background: '#547662', border: 0, borderRadius: '12px', height: '44px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
