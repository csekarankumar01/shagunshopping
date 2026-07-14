import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/api';

const RESEND_COOLDOWN = 30; // seconds

const VerifyEmail = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const email = location.state?.email || params.get('email') || '';
  const next = params.get('next') || '/';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="card w-full max-w-md p-8 text-center">
          <p className="font-bold">No email to verify</p>
          <p className="mt-2 text-sm text-muted">Start by logging in or creating an account.</p>
          <Link to="/login" className="btn-primary btn-sm mt-4 inline-flex">Go to login</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyOtp(email, otp.trim());
      toast('Email verified — welcome!');
      navigate(next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await resendOtp(email);
      toast('New code sent — check your inbox');
      setCooldown(RESEND_COOLDOWN);
      setOtp('');
      inputRef.current?.focus();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft">
          <MailCheck size={22} className="text-sage" />
        </div>
        <p className="eyebrow mt-5">One last step</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We've emailed a 6-digit code to <strong className="text-ink">{email}</strong>.
          Enter it below to verify your email. It expires in 10 minutes — check spam if you don't see it.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="otp">Verification code</label>
            <input
              ref={inputRef}
              id="otp"
              className="input text-center text-2xl font-extrabold tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="••••••"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          {error && <p className="text-sm font-semibold text-mulberry">{error}</p>}
          <button className="btn-primary w-full" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Didn't get it?{' '}
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <button onClick={resend} className="font-bold text-mulberry">Resend code</button>
          )}
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
