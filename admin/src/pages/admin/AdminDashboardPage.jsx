import { useEffect, useMemo, useState } from 'react';
import { Archive, Boxes, Coffee, ImagePlus, LogOut, PackagePlus, RefreshCw, Save, Search } from 'lucide-react';
import BrandMark from '../../components/BrandMark';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/useAuth';
import { archiveProduct, createProduct, fetchAdminCategories, fetchAdminDashboard, updateProduct } from '../../services/adminService';
import '../../css/admin/admin.css';

const initialForm = { name: '', price: '', quantity: '', category_id: '', description: '', image: null, image_url: '' };

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const filteredProducts = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [products, query]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, categoryList] = await Promise.all([fetchAdminDashboard(), fetchAdminCategories()]);
      setMetrics(dashboard.metrics);
      setProducts(dashboard.products);
      setCategories(categoryList);
      setForm((current) => ({ ...current, category_id: current.category_id || categoryList[0]?.id || '' }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submitProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await createProduct(form);
      setForm({ ...initialForm, category_id: categories[0]?.id || '' });
      setNotice('Product added. It is now available in cashier POS.');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const adjustQuantity = async (product, delta) => {
    const quantity = Math.max(0, product.quantity + delta);
    await updateProduct(product.id, { quantity });
    setProducts((items) => items.map((item) => item.id === product.id ? { ...item, quantity } : item));
  };

  const archive = async (product) => {
    await archiveProduct(product.id);
    setProducts((items) => items.map((item) => item.id === product.id ? { ...item, is_active: false, stock_status: 'archived' } : item));
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <BrandMark />
        <div className="admin-search"><Search size={18} /><input placeholder="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="admin-user"><span>{user?.name?.charAt(0) || 'A'}</span><strong>{user?.name || 'Admin'}</strong><button className="icon-button" onClick={logout} title="Logout"><LogOut size={18} /></button></div>
      </header>

      <main className="admin-main">
        {(notice || error) && <div className={`admin-alert ${error ? 'admin-alert--error' : ''}`}>{error || notice}<button onClick={loadDashboard}><RefreshCw size={15} />Refresh</button></div>}
        {loading ? <div className="admin-loader"><LoadingSpinner label="Loading Velluto inventory..." /></div> : (
          <>
            <section className="metric-grid">
              <Metric icon={Coffee} label="Products" value={metrics?.products || 0} />
              <Metric icon={Boxes} label="Active" value={metrics?.active_products || 0} />
              <Metric icon={Archive} label="Low Stock" value={metrics?.low_stock || 0} />
              <Metric icon={PackagePlus} label="Orders" value={metrics?.orders || 0} />
            </section>

            <section className="admin-workspace">
              <form className="product-form" onSubmit={submitProduct}>
                <div className="admin-section-title"><span className="eyebrow">CATALOG</span><h1>Add product</h1></div>
                <label>Product name<input required value={form.name} onChange={updateField('name')} placeholder="Iced Mocha" /></label>
                <div className="form-row"><label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={updateField('price')} /></label><label>Quantity<input required type="number" min="0" value={form.quantity} onChange={updateField('quantity')} /></label></div>
                <label>Category<select required value={form.category_id} onChange={updateField('category_id')}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Description<textarea value={form.description} onChange={updateField('description')} placeholder="Short menu description" /></label>
                <label className="image-upload"><ImagePlus size={20} /><span>{form.image?.name || 'Upload product image to Cloudinary'}</span><input type="file" accept="image/*" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} /></label>
                <label>Or public image URL<input value={form.image_url} onChange={updateField('image_url')} placeholder="https://..." /></label>
                <button className="primary-button" disabled={saving}><Save size={18} />{saving ? 'Saving...' : 'Add product'}</button>
              </form>

              <section className="inventory-panel">
                <div className="admin-section-title"><span className="eyebrow">INVENTORY</span><h1>Manage products</h1></div>
                <div className="inventory-list">
                  {filteredProducts.map((product) => (
                    <article className={`inventory-item ${!product.is_active ? 'is-archived' : ''}`} key={product.id}>
                      <img src={product.image_url} alt={product.name} />
                      <div><strong>{product.name}</strong><span>{product.category_name} · Rs {product.price}</span><small>{product.description || 'No description added.'}</small></div>
                      <div className="stock-control"><button onClick={() => adjustQuantity(product, -1)}>-</button><strong>{product.quantity}</strong><button onClick={() => adjustQuantity(product, 1)}>+</button></div>
                      <button className="archive-button" onClick={() => archive(product)}>Archive</button>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric-card"><span><Icon size={20} /></span><small>{label}</small><strong>{value}</strong></div>;
}
