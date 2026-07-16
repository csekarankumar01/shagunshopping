import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { SHOP_NAME } from '../lib/config';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login(form.email, form.password);
      if (data.needsVerification) {
        navigate(`/verify-email?next=${encodeURIComponent(next)}`, { state: { email: data.email } });
        return;
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <p className="eyebrow">Welcome back</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">Log in to {SHOP_NAME}</h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <div className="mt-1.5 text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-mulberry">
                Forgot password?
              </Link>
            </div>
          </div>
          {error && <p className="text-sm font-semibold text-mulberry">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          New here?{' '}
          <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-mulberry">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
