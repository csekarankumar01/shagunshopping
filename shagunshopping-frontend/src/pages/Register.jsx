import { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Turnstile, { captchaEnabled } from '../components/Turnstile.jsx';
import { getErrorMessage } from '../lib/api';
import { SHOP_NAME } from '../lib/config';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const onCaptcha = useCallback((t) => setCaptchaToken(t), []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await register({ ...form, captchaToken });
      navigate(`/verify-email?next=${encodeURIComponent(next)}`, { state: { email: data.email } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <p className="eyebrow">Join us</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">Create your {SHOP_NAME} account</h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" name="name" className="input" required autoComplete="name" value={form.name} onChange={onChange} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="input" required autoComplete="email" value={form.email} onChange={onChange} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (optional)</label>
            <input id="phone" name="phone" className="input" inputMode="numeric" pattern="[0-9]{10}" title="10-digit mobile number" autoComplete="tel" value={form.phone} onChange={onChange} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="input" required minLength={6} autoComplete="new-password" value={form.password} onChange={onChange} />
            <p className="mt-1 text-xs text-muted">At least 6 characters. We'll email you a code to verify your address.</p>
          </div>
          {error && <p className="text-sm font-semibold text-mulberry">{error}</p>}
          <Turnstile onVerify={onCaptcha} />
          <button className="btn-primary w-full" disabled={busy || (captchaEnabled && !captchaToken)}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-mulberry">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
