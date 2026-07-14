import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import Turnstile, { captchaEnabled } from '../components/Turnstile.jsx';

/*
  Two-step password reset, reusing the same OTP machinery as signup:
  step 1 — email (+ captcha) -> server emails a 6-digit code
  step 2 — code + new password -> password reset, then back to login.
  The server answers step 1 identically whether or not the email exists,
  so this page can't be used to probe which emails have accounts.
*/

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const onCaptcha = useCallback((t) => setCaptchaToken(t), []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email, captchaToken });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong — try again');
    } finally {
      setBusy(false);
    }
  };

  const doReset = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      showToast('Password reset — log in with your new password');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong — try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>

        {step === 1 ? (
          <>
            <p className="mt-2 text-sm text-muted">
              Enter your account email and we'll send a 6-digit reset code.
            </p>
            <form onSubmit={requestCode} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm font-semibold text-mulberry">{error}</p>}
              <Turnstile onVerify={onCaptcha} />
              <button className="btn-primary w-full" disabled={busy || (captchaEnabled && !captchaToken)}>
                {busy ? 'Sending code…' : 'Send reset code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              If <span className="font-semibold">{email}</span> has an account, a code is on its way.
              Enter it below with your new password. The code expires in 10 minutes.
            </p>
            <form onSubmit={doReset} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="otp">6-digit code</label>
                <input
                  id="otp"
                  className="input text-center text-xl tracking-[0.5em]"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div>
                <label className="label" htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm font-semibold text-mulberry">{error}</p>}
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? 'Resetting…' : 'Reset password'}
              </button>
              <button
                type="button"
                className="w-full text-center text-sm font-semibold text-muted"
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
              >
                Didn't get it? Send again
              </button>
            </form>
          </>
        )}

        <p className="mt-5 text-center text-sm text-muted">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-mulberry">Log in</Link>
        </p>
      </div>
    </div>
  );
}
