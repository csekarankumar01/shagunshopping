import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, MapPin, CreditCard, Package, Plus, Pencil, Trash2, LogOut, BadgeCheck } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { inr, formatDate, shortId, STATUS_META } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';
import { COD_FEE } from '../lib/config';

const emptyAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

const Field = ({ label, name, value, onChange, ...rest }) => (
  <div>
    <label className="label" htmlFor={`addr-${name}`}>{label}</label>
    <input id={`addr-${name}`} name={name} value={value} onChange={onChange} className="input" {...rest} />
  </div>
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <section className="card p-6">
    <div className="mb-4 flex items-center gap-2">
      <Icon size={18} className="text-mulberry" />
      <h2 className="font-display text-xl font-bold">{title}</h2>
    </div>
    {children}
  </section>
);

const Account = () => {
  const { user, applyUser, logout } = useAuth();
  const toast = useToast();

  /* ---- profile ---- */
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ---- password ---- */
  const [pwd, setPwd] = useState({ currentPassword: '', password: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  /* ---- addresses ---- */
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null); // null = closed, 'new' = adding, id = editing
  const [savingAddr, setSavingAddr] = useState(false);

  /* ---- recent orders ---- */
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/mine')
      .then(({ data }) => setOrders(data.orders.slice(0, 3)))
      .catch(() => setOrders([]));
  }, []);

  if (!user) return <div className="container-page py-24"><Spinner /></div>;

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      applyUser(data.user);
      toast('Profile updated');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await api.put('/auth/profile', pwd);
      setPwd({ currentPassword: '', password: '' });
      toast('Password changed');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  const setPreferred = async (preferredPayment) => {
    try {
      const { data } = await api.put('/auth/profile', { preferredPayment });
      applyUser(data.user);
      toast(`Checkout will preselect ${preferredPayment === 'cod' ? 'Cash on Delivery' : 'Pay online'}`);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const onAddr = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openNew = () => { setForm({ ...emptyAddress, fullName: user.name, phone: user.phone || '' }); setEditingId('new'); };
  const openEdit = (a) => { setForm({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode }); setEditingId(a._id); };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      const { data } = editingId === 'new'
        ? await api.post('/auth/addresses', form)
        : await api.put(`/auth/addresses/${editingId}`, form);
      applyUser(data.user);
      setEditingId(null);
      toast('Address saved');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSavingAddr(false);
    }
  };

  const removeAddress = async (id) => {
    try {
      const { data } = await api.delete(`/auth/addresses/${id}`);
      applyUser(data.user);
      toast('Address removed');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const makeDefault = async (a) => {
    try {
      const { data } = await api.put(`/auth/addresses/${a._id}`, { ...a, isDefault: true });
      applyUser(data.user);
      toast('Default address updated');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="container-page py-10">
      <p className="eyebrow">My account</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-semibold">Hi, {user.name.split(' ')[0]}!</h1>
        <button onClick={logout} className="btn-ghost btn-sm"><LogOut size={14} /> Log out</button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Profile */}
          <SectionCard icon={UserRound} title="Profile">
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="input flex items-center justify-between bg-porcelain">
                  <span className="truncate">{user.email}</span>
                  <span className="ml-2 inline-flex shrink-0 items-center gap-1 text-xs font-bold text-sage"><BadgeCheck size={14} /> Verified</span>
                </div>
              </div>
              <Field label="Full name" name="name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required maxLength={60} />
              <Field label="Phone" name="phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} inputMode="numeric" pattern="[0-9]{10}" title="10-digit mobile number" />
              <button className="btn-primary btn-sm" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</button>
            </form>
          </SectionCard>

          {/* Password */}
          <SectionCard icon={BadgeCheck} title="Change password">
            <form onSubmit={savePassword} className="space-y-4">
              <Field label="Current password" name="currentPassword" type="password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} required autoComplete="current-password" />
              <Field label="New password" name="password" type="password" value={pwd.password} onChange={(e) => setPwd((p) => ({ ...p, password: e.target.value }))} required minLength={6} autoComplete="new-password" />
              <button className="btn-ghost btn-sm" disabled={savingPwd}>{savingPwd ? 'Changing…' : 'Change password'}</button>
            </form>
          </SectionCard>

          {/* Payment preference */}
          <SectionCard icon={CreditCard} title="Preferred payment">
            <p className="mb-3 text-xs text-muted">Checkout preselects this for you. Card and UPI details are never stored by us — Razorpay handles those securely.</p>
            <div className="space-y-2">
              {[
                { value: 'razorpay', label: 'Pay online', hint: 'UPI, cards, netbanking — lower free-shipping threshold' },
                { value: 'cod', label: 'Cash on delivery', hint: `Pay at the door · ${inr(COD_FEE)} COD fee per order` },
              ].map((opt) => (
                <label key={opt.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${user.preferredPayment === opt.value ? 'border-mulberry bg-blush/40' : 'border-line'}`}>
                  <input type="radio" name="preferredPayment" className="mt-1 accent-mulberry" checked={user.preferredPayment === opt.value} onChange={() => setPreferred(opt.value)} />
                  <span>
                    <span className="block text-sm font-bold">{opt.label}</span>
                    <span className="text-xs text-muted">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Addresses */}
          <SectionCard icon={MapPin} title="Saved addresses">
            {user.addresses.length === 0 && editingId === null && (
              <p className="mb-3 text-sm text-muted">No saved addresses yet — add one and checkout fills itself.</p>
            )}
            <div className="space-y-3">
              {user.addresses.map((a) => (
                <div key={a._id} className={`rounded-xl border p-4 ${a.isDefault ? 'border-mulberry' : 'border-line'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold">
                      {a.fullName}
                      {a.isDefault && <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-mulberry-deep">Default</span>}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => openEdit(a)} aria-label="Edit address" className="rounded-full p-1.5 text-muted hover:text-mulberry"><Pencil size={14} /></button>
                      <button onClick={() => removeAddress(a._id)} aria-label="Delete address" className="rounded-full p-1.5 text-muted hover:text-mulberry"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                    {a.city}, {a.state} — {a.pincode}<br />
                    {a.phone}
                  </p>
                  {!a.isDefault && (
                    <button onClick={() => makeDefault(a)} className="mt-2 text-xs font-bold text-mulberry underline">Set as default</button>
                  )}
                </div>
              ))}
            </div>

            {editingId === null ? (
              <button onClick={openNew} className="btn-ghost btn-sm mt-4"><Plus size={14} /> Add address</button>
            ) : (
              <form onSubmit={saveAddress} className="mt-4 space-y-3 rounded-xl border border-line p-4">
                <p className="text-sm font-bold">{editingId === 'new' ? 'New address' : 'Edit address'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name" name="fullName" value={form.fullName} onChange={onAddr} required />
                  <Field label="Phone" name="phone" value={form.phone} onChange={onAddr} required inputMode="numeric" pattern="[0-9]{10}" title="10-digit mobile number" />
                </div>
                <Field label="Address line 1" name="line1" value={form.line1} onChange={onAddr} required />
                <Field label="Address line 2 (optional)" name="line2" value={form.line2} onChange={onAddr} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="City" name="city" value={form.city} onChange={onAddr} required />
                  <Field label="State" name="state" value={form.state} onChange={onAddr} required />
                  <Field label="PIN code" name="pincode" value={form.pincode} onChange={onAddr} required inputMode="numeric" pattern="[0-9]{6}" title="6-digit PIN code" />
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary btn-sm" disabled={savingAddr}>{savingAddr ? 'Saving…' : 'Save address'}</button>
                  <button type="button" onClick={() => setEditingId(null)} className="btn-ghost btn-sm">Cancel</button>
                </div>
              </form>
            )}
          </SectionCard>

          {/* Recent orders */}
          <SectionCard icon={Package} title="Recent orders">
            {orders === null ? (
              <Spinner />
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted">No orders yet. <Link to="/shop" className="font-bold text-mulberry">Start shopping →</Link></p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => {
                  const meta = STATUS_META[o.status] || {};
                  return (
                    <Link key={o._id} to={`/orders/${o._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3 transition-colors hover:border-mulberry">
                      <span>
                        <span className="block text-sm font-bold">{shortId(o._id)}</span>
                        <span className="text-xs text-muted">{formatDate(o.createdAt)} · {o.orderItems.length} item{o.orderItems.length > 1 ? 's' : ''}</span>
                      </span>
                      <span className="text-right">
                        <span className={`block text-xs font-bold ${meta.text || 'text-muted'}`}>{meta.label || o.status}</span>
                        <span className="text-sm font-extrabold">{inr(o.totalPrice)}</span>
                      </span>
                    </Link>
                  );
                })}
                <Link to="/orders" className="btn-ghost btn-sm w-full">View all orders</Link>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Account;
