import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { BRANDS, CATEGORIES } from '../../lib/config';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

const empty = {
  name: '',
  brand: '',
  category: 'Skincare',
  description: '',
  size: '',
  ingredients: '',
  howToUse: '',
  mrp: '',
  price: '',
  stock: '',
  images: [],
  featured: false,
  isActive: true,
};

const ProductForm = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(null); // { done, total } while multi-upload runs
  const fileInputRef = useRef(null);
  const MAX_IMAGES = 25;

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/products/admin/all`)
      .then(({ data }) => {
        const p = data.products.find((x) => x._id === id);
        if (!p) throw new Error();
        setForm({
          name: p.name,
          brand: p.brand,
          category: p.category,
          description: p.description || '',
          size: p.size || '',
          ingredients: p.ingredients || '',
          howToUse: p.howToUse || '',
          mrp: p.mrp,
          price: p.price,
          stock: p.stock,
          images: Array.isArray(p.images) ? [...p.images] : [],
          featured: p.featured,
          isActive: p.isActive,
        });
      })
      .catch(() => setError('Could not load this product'))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setImage = (i, value) =>
    setForm((f) => ({ ...f, images: f.images.map((img, idx) => (idx === i ? value : img)) }));
  const removeImage = (i) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const addUrlRow = () => setForm((f) => ({ ...f, images: [...f.images, ''] }));

  const uploadPhotos = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same files
    if (!picked.length) return;
    const room = MAX_IMAGES - form.images.filter(Boolean).length;
    if (room <= 0) return toast(`Photo limit reached (${MAX_IMAGES} per product)`, 'error');
    const files = picked.slice(0, room);
    if (picked.length > room) toast(`Only ${room} more photo(s) allowed — uploading the first ${room}`);
    setUploading({ done: 0, total: files.length });
    let ok = 0;
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await api.post('/upload', fd);
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
        ok++;
      } catch (err) {
        toast(`${file.name}: ${getErrorMessage(err)}`, 'error');
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (ok) toast(`${ok} photo${ok > 1 ? 's' : ''} uploaded`);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (Number(form.price) > Number(form.mrp)) {
      setError('Selling price cannot be higher than MRP');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        mrp: Number(form.mrp),
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.images.map((s) => s.trim()).filter(Boolean),
      };
      if (editing) {
        await api.put(`/products/${id}`, payload);
        toast('Product updated');
      } else {
        await api.post('/products', payload);
        toast('Product added');
      }
      navigate('/admin/products');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading product" />;

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <h2 className="text-lg font-bold">{editing ? 'Edit product' : 'Add a product'}</h2>

      <div>
        <label className="label" htmlFor="name">Product name</label>
        <input id="name" className="input" required maxLength={140} value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="brand">Brand</label>
          <input id="brand" className="input" required list="brand-list" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          <datalist id="brand-list">
            {BRANDS.map((b) => <option key={b} value={b} />)}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="mrp">MRP (₹)</label>
          <input id="mrp" type="number" min="1" step="1" className="input" required value={form.mrp} onChange={(e) => set('mrp', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="price">Selling price (₹)</label>
          <input id="price" type="number" min="1" step="1" className="input" required value={form.price} onChange={(e) => set('price', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="stock">Stock</label>
          <input id="stock" type="number" min="0" step="1" className="input" required value={form.stock} onChange={(e) => set('stock', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="size">Size / quantity (e.g. 50 ml, 100 g)</label>
        <input id="size" className="input sm:max-w-48" maxLength={40} value={form.size} onChange={(e) => set('size', e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" rows={4} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="ingredients">Key ingredients</label>
        <textarea id="ingredients" rows={2} className="input" placeholder="e.g. Niacinamide 10%, zinc, hyaluronic acid" value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="howToUse">How to use</label>
        <textarea id="howToUse" rows={2} className="input" placeholder="Short usage directions shown on the product page" value={form.howToUse} onChange={(e) => set('howToUse', e.target.value)} />
      </div>

      <div>
        <p className="label">Product photos (up to 3 — artwork shows automatically if empty)</p>
        <p className="mb-2 text-xs text-muted">
          Add up to 25 photos — select multiple files at once (JPG/PNG/WebP, max 3 MB each) or paste image URLs.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={uploadPhotos}
        />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading !== null}
            className="btn-primary btn-sm"
          >
            <Upload size={14} />
            {uploading ? `Uploading ${uploading.done + 1} of ${uploading.total}…` : 'Upload photos'}
          </button>
          <button type="button" onClick={addUrlRow} className="btn-ghost btn-sm" disabled={uploading !== null}>
            Add by URL
          </button>
          <span className="text-xs font-semibold text-muted">
            {form.images.filter(Boolean).length}/{MAX_IMAGES} — select many files at once
          </span>
        </div>
        <div className="space-y-2">
          {form.images.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              {img ? (
                <img
                  src={img}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover"
                />
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-lg border border-dashed border-line" />
              )}
              <input
                className="input"
                placeholder={`https://... (photo ${i + 1})`}
                value={img}
                onChange={(e) => setImage(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="shrink-0 rounded-full p-2 text-muted hover:text-mulberry"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="accent-mulberry" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
          Featured on home page
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="accent-mulberry" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Visible in store
        </label>
      </div>

      {error && <p className="text-sm font-semibold text-mulberry">{error}</p>}

      <div className="flex gap-3">
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => navigate('/admin/products')}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
