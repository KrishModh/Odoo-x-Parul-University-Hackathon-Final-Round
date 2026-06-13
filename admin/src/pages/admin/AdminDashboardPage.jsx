import { useEffect, useMemo, useState } from 'react';
import { Archive, Boxes, Coffee, ImagePlus, LogOut, PackagePlus, RefreshCw, Save, Search, Ticket, Trash2 } from 'lucide-react';
import BrandMark from '../../components/BrandMark';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/useAuth';
import { 
  archiveProduct, 
  createProduct, 
  fetchAdminCategories, 
  fetchAdminDashboard, 
  updateProduct,
  fetchCoupons,
  createCoupon,
  deleteCoupon,
  updateCouponStatus
} from '../../services/adminService';
import '../../css/admin/admin.css';

const initialForm = { name: '', price: '', quantity: '', category_id: '', description: '', image: null, image_url: '' };
const initialCouponForm = { code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '0', expiry_date: '', max_usage: '' };

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'coupons'
  const [metrics, setMetrics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [couponSaving, setCouponSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const filteredProducts = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const filteredCoupons = useMemo(() => coupons.filter((coupon) => coupon.code.toLowerCase().includes(query.toLowerCase())), [coupons, query]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, categoryList, couponList] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminCategories(),
        fetchCoupons()
      ]);
      setMetrics(dashboard.metrics);
      setProducts(dashboard.products);
      setCategories(categoryList);
      setCoupons(couponList.data || []);
      setForm((current) => ({ ...current, category_id: current.category_id || categoryList[0]?.id || '' }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await fetchCoupons();
      setCoupons(res.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load coupons.');
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

  const submitCoupon = async (event) => {
    event.preventDefault();
    setCouponSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await createCoupon(couponForm);
      setCouponForm(initialCouponForm);
      setNotice(`Coupon "${res.data.code}" created successfully.`);
      await loadCoupons();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create coupon.');
    } finally {
      setCouponSaving(false);
    }
  };

  const handleToggleCoupon = async (coupon) => {
    setError('');
    setNotice('');
    try {
      const nextActive = !coupon.is_active;
      const res = await updateCouponStatus(coupon.id, nextActive);
      setCoupons((items) => items.map((item) => item.id === coupon.id ? { ...item, is_active: res.data.is_active } : item));
      setNotice(`Coupon "${coupon.code}" ${nextActive ? 'enabled' : 'disabled'} successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update coupon status.');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    setError('');
    setNotice('');
    try {
      await deleteCoupon(coupon.id);
      setCoupons((items) => items.filter((item) => item.id !== coupon.id));
      setNotice(`Coupon "${coupon.code}" deleted successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete coupon.');
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <BrandMark />
        <div className="admin-search">
          <Search size={18} />
          <input 
            placeholder={activeTab === 'inventory' ? "Search inventory" : "Search coupon codes"} 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
          />
        </div>
        <div className="admin-user"><span>{user?.name?.charAt(0) || 'A'}</span><strong>{user?.name || 'Admin'}</strong><button className="icon-button" onClick={logout} title="Logout"><LogOut size={18} /></button></div>
      </header>

      <main className="admin-main">
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => { setActiveTab('inventory'); setQuery(''); }}>
            Inventory
          </button>
          <button className={`admin-tab ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => { setActiveTab('coupons'); setQuery(''); }}>
            Coupons
          </button>
        </div>

        {(notice || error) && <div className={`admin-alert ${error ? 'admin-alert--error' : ''}`}>{error || notice}<button onClick={loadDashboard}><RefreshCw size={15} />Refresh</button></div>}
        {loading ? <div className="admin-loader"><LoadingSpinner label="Loading Velluto admin..." /></div> : (
          <>
            {activeTab === 'inventory' ? (
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
            ) : (
              <>
                <section className="metric-grid">
                  <Metric icon={Ticket} label="Total Coupons" value={coupons.length} />
                  <Metric icon={Boxes} label="Active Coupons" value={coupons.filter(c => c.is_active).length} />
                  <Metric icon={Coffee} label="Total Coupon Uses" value={coupons.reduce((sum, c) => sum + c.used_count, 0)} />
                  <Metric icon={PackagePlus} label="Orders" value={metrics?.orders || 0} />
                </section>

                <section className="admin-workspace">
                  <form className="product-form" onSubmit={submitCoupon}>
                    <div className="admin-section-title"><span className="eyebrow">DISCOUNTS</span><h1>Create Coupon</h1></div>
                    <label>Coupon Code
                      <input 
                        required 
                        value={couponForm.code} 
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })} 
                        placeholder="WELCOME10" 
                      />
                    </label>
                    
                    <div className="form-row">
                      <label>Discount Type
                        <select 
                          required 
                          value={couponForm.discount_type} 
                          onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </label>
                      <label>Discount Value
                        <input 
                          required 
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          value={couponForm.discount_value} 
                          onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} 
                          placeholder={couponForm.discount_type === 'percentage' ? "10" : "100"}
                        />
                      </label>
                    </div>

                    <div className="form-row">
                      <label>Min Order Amount (₹)
                        <input 
                          required 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={couponForm.min_order_amount} 
                          onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })} 
                        />
                      </label>
                      <label>Max Usage Count
                        <input 
                          type="number" 
                          min="1" 
                          value={couponForm.max_usage} 
                          onChange={(e) => setCouponForm({ ...couponForm, max_usage: e.target.value })} 
                          placeholder="Unlimited"
                        />
                      </label>
                    </div>

                    <label>Expiry Date
                      <input 
                        type="datetime-local" 
                        value={couponForm.expiry_date} 
                        onChange={(e) => setCouponForm({ ...couponForm, expiry_date: e.target.value })} 
                      />
                    </label>

                    <button className="primary-button" disabled={couponSaving}>
                      <Save size={18} />
                      {couponSaving ? 'Creating...' : 'Create Coupon'}
                    </button>
                  </form>

                  <section className="inventory-panel">
                    <div className="admin-section-title"><span className="eyebrow">COUPONS</span><h1>Manage Coupons</h1></div>
                    <div className="coupon-table-container">
                      <table className="coupon-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Expiry</th>
                            <th>Usage</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCoupons.map((coupon) => (
                            <tr key={coupon.id} className="coupon-row">
                              <td>
                                <span className="coupon-code-badge">{coupon.code}</span>
                              </td>
                              <td>
                                <strong>
                                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                </strong>
                                <div style={{ fontSize: '0.75rem', color: '#8a7b70', marginTop: '2px' }}>
                                  Min Order: ₹{coupon.min_order_amount}
                                </div>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: '#6c625a' }}>
                                {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleString() : 'Never'}
                              </td>
                              <td>
                                <strong style={{ color: '#49352a' }}>{coupon.used_count}</strong>
                                <span style={{ color: '#8a7b70', fontSize: '0.8rem' }}>
                                  {coupon.max_usage ? ` / ${coupon.max_usage}` : ' (Unlimited)'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${coupon.is_active ? 'badge--success' : 'badge--danger'}`}>
                                  {coupon.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="coupon-action-btn" 
                                  onClick={() => handleToggleCoupon(coupon)}
                                >
                                  {coupon.is_active ? 'Disable' : 'Enable'}
                                </button>
                                <button 
                                  className="coupon-action-btn coupon-action-btn--delete" 
                                  onClick={() => handleDeleteCoupon(coupon)}
                                >
                                  <Trash2 size={14} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredCoupons.length === 0 && (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#8a7b70' }}>
                                No coupons found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric-card"><span><Icon size={20} /></span><small>{label}</small><strong>{value}</strong></div>;
}
