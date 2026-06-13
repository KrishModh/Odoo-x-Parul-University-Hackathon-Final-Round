import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Archive, Boxes, Coffee, ImagePlus, LogOut, Menu, PackagePlus, Pencil, RefreshCw, Save, Search, Settings, Table2, Ticket, Trash2, UserCheck, Users, Mail, Phone, TrendingUp, Star, X, ChevronRight, Calendar, BarChart3 } from 'lucide-react';
import BrandMark from '../../components/BrandMark';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProfileMenu from '../../components/ProfileMenu';
import ProfileManagementModal from '../../components/ProfileManagementModal';
import ReportsPage from './ReportsPage';
import { useAuth } from '../../context/useAuth';
import * as authService from '../../services/authService';
import { 
  archiveProduct, 
  createProduct, 
  deleteProduct,
  fetchAdminCategories, 
  fetchAdminDashboard, 
  fetchAdminTables,
  updateProduct,
  createTable,
  updateTable,
  deleteTable,
  fetchCoupons,
  createCoupon,
  deleteCoupon,
  updateCouponStatus,
  fetchEmployeeRequests,
  approveEmployee,
  rejectEmployee,
  removeEmployee,
  restoreEmployee,
  fetchCustomers,
  fetchCustomerOrders,
  updateProductStock,
} from '../../services/adminService';
import '../../css/admin/admin.css';

const initialForm = { name: '', price: '', quantity: '', category_id: '', description: '', image: null, image_url: '' };
const initialCouponForm = { code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '0', expiry_date: '', max_usage: '' };
const initialTableForm = { table_name: '', seat_capacity: '4', is_active: true };
const adminNavItems = [
  { id: 'inventory', label: 'Dashboard / Inventory', icon: Coffee },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'approvals', label: 'Staff Approval', icon: UserCheck },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'tables', label: 'Table Management', icon: Table2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const [localUser, setLocalUser] = useState(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setLocalUser(user);
  }, [user]);
  const [activeTab, setActiveTab] = useState(location.pathname === '/admin/reports' ? 'reports' : 'inventory');

  useEffect(() => {
    if (location.pathname === '/admin/reports') {
      setActiveTab('reports');
    } else if (location.pathname === '/admin') {
      if (activeTab === 'reports') {
        setActiveTab('inventory');
      }
    }
  }, [location.pathname]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [tables, setTables] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerAnalytics, setCustomerAnalytics] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [tableForm, setTableForm] = useState(initialTableForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingTableId, setEditingTableId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [couponSaving, setCouponSaving] = useState(false);
  const [tableSaving, setTableSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Rejection modal states
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Removal modal states
  const [removalTarget, setRemovalTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const filteredProducts = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const filteredCoupons = useMemo(() => coupons.filter((coupon) => coupon.code.toLowerCase().includes(query.toLowerCase())), [coupons, query]);
  const filteredTables = useMemo(() => tables.filter((table) => (table.table_name || table.name || '').toLowerCase().includes(query.toLowerCase())), [tables, query]);
  const filteredRequests = useMemo(() => employeeRequests.filter((req) => 
    req.name.toLowerCase().includes(query.toLowerCase()) || 
    req.email.toLowerCase().includes(query.toLowerCase())
  ), [employeeRequests, query]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, categoryList, couponList, requestList, tableList] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminCategories(),
        fetchCoupons(),
        fetchEmployeeRequests(),
        fetchAdminTables()
      ]);
      setMetrics(dashboard.metrics);
      setProducts(dashboard.products);
      setCategories(categoryList);
      setCoupons(couponList.data || []);
      setEmployeeRequests(requestList.data || []);
      setTables(tableList.data || []);
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

  const loadEmployeeRequests = async () => {
    try {
      const res = await fetchEmployeeRequests();
      setEmployeeRequests(res.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load employee requests.');
    }
  };

  const loadCustomers = useCallback(async (filter = activeFilter, search = query) => {
    setCustomerLoading(true);
    try {
      const res = await fetchCustomers({
        search: activeTab === 'customers' ? search : '',
        filter: filter === 'all' ? '' : filter,
      });
      setCustomers(res.data || []);
      setCustomerAnalytics(res.analytics || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load customers.');
    } finally {
      setCustomerLoading(false);
    }
  }, [activeFilter, activeTab, query]);

  const openCustomerDetail = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerOrders([]);
    setCustomerOrdersLoading(true);
    try {
      const res = await fetchCustomerOrders(customer.email);
      setCustomerOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setCustomerOrdersLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (activeTab === 'customers') {
      loadCustomers(activeFilter, query);
    }
  }, [activeTab]);

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const goToTab = (tab) => {
    setActiveTab(tab);
    setQuery('');
    setSidebarOpen(false);
    if (tab === 'customers') setActiveFilter('all');
    if (tab === 'reports') {
      navigate('/admin/reports');
    } else {
      navigate('/admin');
    }
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (editingProductId) {
        await updateProduct(editingProductId, form);
        setNotice('Product updated. Cashier POS will use the latest details.');
        setEditingProductId(null);
      } else {
        await createProduct(form);
        setNotice('Product added. It is now available in cashier POS.');
      }
      setForm({ ...initialForm, category_id: categories[0]?.id || '' });
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const adjustQuantity = async (product, delta) => {
    const res = await updateProductStock(product.id, { delta });
    setProducts((items) => items.map((item) => item.id === product.id ? res.data : item));
  };

  const archive = async (product) => {
    const res = await archiveProduct(product.id, !product.is_active);
    setProducts((items) => items.map((item) => item.id === product.id ? res.data : item));
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      quantity: product.quantity ?? '',
      category_id: product.category_id || categories[0]?.id || '',
      description: product.description || '',
      image: null,
      image_url: product.image_url || '',
    });
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}" permanently?`)) return;
    await deleteProduct(product.id);
    setProducts((items) => items.filter((item) => item.id !== product.id));
    setNotice(`"${product.name}" deleted permanently.`);
  };

  const stockLabel = (product) => {
    if (!product.is_active) return 'Archived';
    if (product.quantity === 0) return 'Out of Stock';
    if (product.quantity < 5) return 'Low Stock';
    return 'In Stock';
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

  const submitTable = async (event) => {
    event.preventDefault();
    setTableSaving(true);
    setError('');
    setNotice('');
    try {
      const action = editingTableId ? updateTable(editingTableId, tableForm) : createTable(tableForm);
      const res = await action;
      setTables((items) => editingTableId
        ? items.map((item) => item.id === editingTableId ? res.data : item)
        : [...items, res.data]);
      setTableForm(initialTableForm);
      setEditingTableId(null);
      setNotice('Table management updated. Cashier POS will show the latest active tables.');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save table.');
    } finally {
      setTableSaving(false);
    }
  };

  const editTable = (table) => {
    setEditingTableId(table.id);
    setTableForm({
      table_name: table.table_name || table.name || '',
      seat_capacity: String(table.seat_capacity || table.seats || 4),
      is_active: table.is_active,
    });
  };

  const removeTable = async (table) => {
    if (!window.confirm(`Delete "${table.table_name || table.name}"?`)) return;
    await deleteTable(table.id);
    setTables((items) => items.filter((item) => item.id !== table.id));
    setNotice('Table deleted. Cashier POS will no longer show it.');
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

  const handleApproveEmployee = async (requestId) => {
    setError('');
    setNotice('');
    try {
      await approveEmployee(requestId);
      setNotice('Employee request approved successfully.');
      await loadEmployeeRequests();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to approve employee request.');
    }
  };

  const handleRejectEmployee = async (event) => {
    event.preventDefault();
    if (!rejectionTarget) return;
    setRejecting(true);
    setError('');
    setNotice('');
    try {
      await rejectEmployee(rejectionTarget.id, { rejection_reason: rejectionReason });
      setNotice(`Employee request for "${rejectionTarget.name}" rejected.`);
      setRejectionTarget(null);
      setRejectionReason('');
      await loadEmployeeRequests();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reject employee request.');
    } finally {
      setRejecting(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!removalTarget) return;
    setRemoving(true);
    setError('');
    setNotice('');
    try {
      await removeEmployee(removalTarget.id);
      setNotice(`Employee "${removalTarget.name}" removed successfully.`);
      setRemovalTarget(null);
      await loadEmployeeRequests();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove employee.');
    } finally {
      setRemoving(false);
    }
  };

  const handleRestoreEmployee = async (requestId) => {
    setError('');
    setNotice('');
    try {
      await restoreEmployee(requestId);
      setNotice('Employee restored successfully.');
      await loadEmployeeRequests();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to restore employee.');
    }
  };

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'admin-shell--collapsed' : ''}`}>
      {sidebarOpen && <button className="admin-sidebar-backdrop" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar__brand"><BrandMark /></div>
        <nav className="admin-sidebar__nav">
          {adminNavItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`admin-sidebar__item ${activeTab === id ? 'active' : ''}`} onClick={() => goToTab(id)} title={label}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-sidebar__collapse" onClick={() => setSidebarCollapsed((value) => !value)}>
          <ChevronRight size={17} /><span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </aside>
      <header className="admin-topbar">
        <button className="admin-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
        <div className="admin-search">
          <Search size={18} />
          <input 
            placeholder={
            activeTab === 'inventory' ? 'Search inventory' :
              activeTab === 'coupons' ? 'Search coupon codes' :
              activeTab === 'tables' ? 'Search tables' :
              activeTab === 'customers' ? 'Search customers by name, email, phone...' :
              'Search employees by name/email'
            } 
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (activeTab === 'customers') {
                loadCustomers(activeFilter, event.target.value);
              }
            }}
          />
        </div>
        <ProfileMenu 
          user={localUser} 
          roleLabel="Admin" 
          onLogout={logout} 
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenPassword={() => setIsProfileModalOpen(true)}
        />
      </header>

      <main className="admin-main">
        {(notice || error) && <div className={`admin-alert ${error ? 'admin-alert--error' : ''}`}>{error || notice}<button onClick={loadDashboard}><RefreshCw size={15} />Refresh</button></div>}
        {loading ? <div className="admin-loader"><LoadingSpinner label="Loading Velluto admin..." /></div> : (
          <>
            {activeTab === 'inventory' && (
              <>
                <section className="metric-grid">
                  <Metric icon={Coffee} label="Products" value={metrics?.products || 0} />
                  <Metric icon={Boxes} label="Active" value={metrics?.active_products || 0} />
                  <Metric icon={Archive} label="Low Stock" value={metrics?.low_stock || 0} />
                  <Metric icon={PackagePlus} label="Orders" value={metrics?.orders || 0} />
                  <button className="metric-card metric-card--button" onClick={() => goToTab('tables')}>
                    <span><Table2 size={20} /></span><small>Total Tables</small><strong>{tables.length}</strong><em>Manage Tables</em>
                  </button>
                </section>

                <section className="admin-workspace">
                  <form className="product-form" onSubmit={submitProduct}>
                    <div className="admin-section-title"><span className="eyebrow">CATALOG</span><h1>{editingProductId ? 'Edit product' : 'Add product'}</h1></div>
                    <label>Product name<input required value={form.name} onChange={updateField('name')} placeholder="Iced Mocha" /></label>
                    <div className="form-row"><label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={updateField('price')} /></label><label>Stock Quantity<input required type="number" min="0" value={form.quantity} onChange={updateField('quantity')} /></label></div>
                    <label>Category<select required value={form.category_id} onChange={updateField('category_id')}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                    <label>Description<textarea value={form.description} onChange={updateField('description')} placeholder="Short menu description" /></label>
                    <label className="image-upload"><ImagePlus size={20} /><span>{form.image?.name || 'Upload product image to Cloudinary'}</span><input type="file" accept="image/*" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} /></label>
                    <label>Or public image URL<input value={form.image_url} onChange={updateField('image_url')} placeholder="https://..." /></label>
                    <button className="primary-button" disabled={saving}><Save size={18} />{saving ? 'Saving...' : editingProductId ? 'Update product' : 'Add product'}</button>
                    {editingProductId && <button type="button" className="archive-button" onClick={() => { setEditingProductId(null); setForm({ ...initialForm, category_id: categories[0]?.id || '' }); }}>Cancel edit</button>}
                  </form>

                  <section className="inventory-panel">
                    <div className="admin-section-title"><span className="eyebrow">INVENTORY</span><h1>Manage products</h1></div>
                    <div className="inventory-list">
                      {filteredProducts.map((product) => {
                        const isOut = product.quantity <= 0;
                        const isLow = product.quantity > 0 && product.quantity <= 5;
                        return (
                          <article className={`inventory-item ${!product.is_active ? 'is-archived' : ''}`} key={product.id}>
                            <img src={product.image_url} alt={product.name} />
                            <div className="stock-badges-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifySelf: 'start' }}>
                              <span className={`badge stock-badge stock-badge--${isOut ? 'out' : isLow ? 'low' : 'in'}`}>{stockLabel(product)}</span>
                              {isOut && <span className="badge stock-badge stock-badge--out" style={{ fontSize: '0.65rem', padding: '2px 4px', fontWeight: 'bold' }}>OUT OF STOCK</span>}
                              {isLow && <span className="badge stock-badge stock-badge--low" style={{ fontSize: '0.65rem', padding: '2px 4px', fontWeight: 'bold' }}>LOW STOCK</span>}
                            </div>
                            <div>
                              <strong>{product.name}</strong>
                              <span>{product.category_name} · Rs {product.price}</span>
                              <small style={{ marginTop: '4px', display: 'block' }}>{product.description || 'No description added.'}</small>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                              <div style={{ background: '#f4eee8', borderRadius: '10px', padding: '6px 12px', textAlign: 'center' }}>
                                <small style={{ fontSize: '0.64rem', color: '#8a7b70', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>Current Stock</small>
                                <strong style={{ fontSize: '1.2rem', color: '#3b2b22', display: 'block', marginTop: '2px' }}>{product.quantity}</strong>
                              </div>
                              <button 
                                type="button"
                                className="coupon-action-btn" 
                                onClick={() => editProduct(product)}
                                style={{ margin: 0, width: '100%', padding: '6px', fontSize: '0.74rem', fontWeight: '900', border: '1px solid #d5c5b6' }}
                              >
                                Manage Stock
                              </button>
                            </div>
                            <div className="inventory-actions"><button className="coupon-action-btn" onClick={() => editProduct(product)}><Pencil size={14} /> Edit</button><button className="coupon-action-btn" onClick={() => archive(product)}><Archive size={14} /> {product.is_active ? 'Archive' : 'Unarchive'}</button><button className="coupon-action-btn coupon-action-btn--delete" onClick={() => removeProduct(product)}><Trash2 size={14} /> Delete</button></div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                </section>
              </>
            )}

            {activeTab === 'coupons' && (
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

            {activeTab === 'approvals' && (
              <>
                <section className="metric-grid">
                  <Metric icon={UserCheck} label="Pending Approvals" value={employeeRequests.filter(r => r.approval_status === 'pending').length} />
                  <Metric icon={Boxes} label="Active Employees" value={employeeRequests.filter(r => r.approval_status === 'approved' && r.is_active).length} />
                  <Metric icon={Archive} label="Removed Employees" value={employeeRequests.filter(r => r.approval_status === 'approved' && !r.is_active).length} />
                  <Metric icon={PackagePlus} label="Total Requests" value={employeeRequests.length} />
                </section>

                <section className="inventory-panel" style={{ gridColumn: '1 / -1' }}>
                  <div className="admin-section-title"><span className="eyebrow">STAFF</span><h1>Employee Approval Requests</h1></div>
                  <div className="coupon-table-container">
                    <table className="coupon-table">
                      <thead>
                        <tr>
                          <th>Employee Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Signup Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((req) => (
                          <tr key={req.id} className="coupon-row">
                            <td>
                              <strong>{req.name}</strong>
                            </td>
                            <td>{req.email}</td>
                            <td>
                              <span className="coupon-code-badge" style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                {req.role}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#6c625a' }}>
                              {req.signup_date ? new Date(req.signup_date).toLocaleString() : 'N/A'}
                            </td>
                            <td>
                              {req.approval_status === 'pending' && (
                                <span className="badge badge--warning">Pending</span>
                              )}
                              {req.approval_status === 'rejected' && (
                                <span className="badge badge--danger">Rejected</span>
                              )}
                              {req.approval_status === 'approved' && (
                                req.is_active ? (
                                  <span className="badge badge--success">Active</span>
                                ) : (
                                  <span className="badge badge--danger">Removed</span>
                                )
                              )}
                              {req.approval_status === 'rejected' && req.rejection_reason && (
                                <div style={{ fontSize: '0.75rem', color: '#9c554d', marginTop: '4px', maxWidth: '200px', wordBreak: 'break-all' }}>
                                  Reason: {req.rejection_reason}
                                </div>
                              )}
                            </td>
                            <td>
                              {req.approval_status === 'pending' && (
                                <>
                                  <button 
                                    className="coupon-action-btn" 
                                    onClick={() => handleApproveEmployee(req.id)}
                                    style={{ color: '#3b7d55', borderColor: '#e3eee8' }}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    className="coupon-action-btn coupon-action-btn--delete" 
                                    onClick={() => setRejectionTarget(req)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {req.approval_status === 'approved' && (
                                req.is_active ? (
                                  <button 
                                    className="coupon-action-btn coupon-action-btn--delete" 
                                    onClick={() => setRemovalTarget(req)}
                                  >
                                    Remove Employee
                                  </button>
                                ) : (
                                  <button 
                                    className="coupon-action-btn" 
                                    onClick={() => handleRestoreEmployee(req.id)}
                                    style={{ color: '#3b7d55', borderColor: '#e3eee8' }}
                                  >
                                    Restore Employee
                                  </button>
                                )
                              )}
                              {req.approval_status === 'rejected' && (
                                <span style={{ color: '#8a7b70', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                  Rejected
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredRequests.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#8a7b70' }}>
                              No requests found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'tables' && (
              <>
                <section className="metric-grid">
                  <Metric icon={Table2} label="Total Tables" value={tables.length} />
                  <Metric icon={Boxes} label="Active Tables" value={tables.filter((table) => table.is_active).length} />
                  <Metric icon={Archive} label="Inactive Tables" value={tables.filter((table) => !table.is_active).length} />
                  <Metric icon={Coffee} label="Seats" value={tables.reduce((sum, table) => sum + Number(table.seat_capacity || table.seats || 0), 0)} />
                </section>

                <section className="admin-workspace">
                  <form className="product-form" onSubmit={submitTable}>
                    <div className="admin-section-title"><span className="eyebrow">FLOOR</span><h1>{editingTableId ? 'Edit table' : 'Add table'}</h1></div>
                    <label>Table name<input required value={tableForm.table_name} onChange={(e) => setTableForm({ ...tableForm, table_name: e.target.value })} placeholder="Table 10" /></label>
                    <label>Seat count<input required type="number" min="1" value={tableForm.seat_capacity} onChange={(e) => setTableForm({ ...tableForm, seat_capacity: e.target.value })} /></label>
                    <label className="admin-toggle"><input type="checkbox" checked={tableForm.is_active} onChange={(e) => setTableForm({ ...tableForm, is_active: e.target.checked })} /> Enable table in POS</label>
                    <button className="primary-button" disabled={tableSaving}><Save size={18} />{tableSaving ? 'Saving...' : editingTableId ? 'Update table' : 'Add table'}</button>
                    {editingTableId && <button type="button" className="archive-button" onClick={() => { setEditingTableId(null); setTableForm(initialTableForm); }}>Cancel edit</button>}
                  </form>

                  <section className="inventory-panel">
                    <div className="admin-section-title"><span className="eyebrow">TABLE MANAGEMENT</span><h1>Manage Tables</h1></div>
                    <div className="coupon-table-container">
                      <table className="coupon-table">
                        <thead><tr><th>Table</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {filteredTables.map((table) => (
                            <tr key={table.id} className="coupon-row">
                              <td><strong>{table.table_name || table.name}</strong></td>
                              <td>{table.seat_capacity || table.seats}</td>
                              <td><span className={`badge ${table.is_active ? 'badge--success' : 'badge--danger'}`}>{table.is_active ? 'Active' : 'Inactive'}</span></td>
                              <td>
                                <button className="coupon-action-btn" onClick={() => editTable(table)}><Pencil size={14} /> Edit</button>
                                <button className="coupon-action-btn" onClick={async () => {
                                  const res = await updateTable(table.id, { is_active: !table.is_active });
                                  setTables((items) => items.map((item) => item.id === table.id ? res.data : item));
                                }}>{table.is_active ? 'Disable' : 'Enable'}</button>
                                <button className="coupon-action-btn coupon-action-btn--delete" onClick={() => removeTable(table)}><Trash2 size={14} /> Delete</button>
                              </td>
                            </tr>
                          ))}
                          {filteredTables.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#8a7b70' }}>No tables found.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </section>
              </>
            )}

            {activeTab === 'settings' && (
              <section className="inventory-panel" style={{ gridColumn: '1 / -1' }}>
                <div className="admin-section-title"><span className="eyebrow">ADMIN</span><h1>Settings</h1></div>
                <div className="settings-panel">
                  <button className="quick-admin-link" onClick={() => goToTab('tables')}><Table2 size={20} /><strong>Manage Tables</strong><span>{tables.filter((table) => table.is_active).length} active of {tables.length}</span></button>
                  <button className="quick-admin-link" onClick={() => goToTab('inventory')}><Boxes size={20} /><strong>Inventory Controls</strong><span>{products.filter((product) => product.quantity < 5).length} low-stock products</span></button>
                </div>
              </section>
            )}

            {activeTab === 'customers' && (
              <>
                {/* Analytics Cards */}
                <section className="metric-grid">
                  <Metric icon={Users} label="Total Customers" value={customerAnalytics?.total_customers ?? '—'} />
                  <Metric icon={PackagePlus} label="Total Orders" value={customerAnalytics?.total_orders ?? '—'} />
                  <Metric icon={TrendingUp} label="Total Revenue" value={customerAnalytics ? `₹${Number(customerAnalytics.total_revenue).toLocaleString('en-IN')}` : '—'} />
                  <Metric icon={Star} label="Repeat Customers" value={customerAnalytics?.repeat_customers ?? '—'} />
                  <Metric icon={Calendar} label="Today's Customers" value={customerAnalytics?.todays_customers ?? '—'} />
                </section>

                {/* Filter chips */}
                <div className="cust-filter-bar">
                  {['all', 'today', 'week', 'month', 'top'].map((f) => (
                    <button
                      key={f}
                      className={`cust-filter-chip ${activeFilter === f ? 'cust-filter-chip--active' : ''}`}
                      onClick={() => { setActiveFilter(f); loadCustomers(f, query); }}
                    >
                      {f === 'all' ? 'All Time' : f === 'top' ? '🏆 Top Spenders' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                  <button
                    className="cust-export-btn"
                    onClick={() => {
                      const csv = [
                        ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Last Visit', 'Repeat'],
                        ...customers.map(c => [
                          c.name, c.email, c.phone, c.total_orders,
                          c.total_spent, c.last_visit ? new Date(c.last_visit).toLocaleDateString() : '',
                          c.is_repeat ? 'Yes' : 'No'
                        ])
                      ].map(r => r.join(',')).join('\n');
                      const a = document.createElement('a');
                      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                      a.download = 'velluto-customers.csv';
                      a.click();
                    }}
                  >
                    ↓ Export CSV
                  </button>
                </div>

                {/* Customer Table */}
                <section className="inventory-panel" style={{ gridColumn: '1 / -1' }}>
                  <div className="admin-section-title"><span className="eyebrow">BILLING</span><h1>Customer Management</h1></div>
                  {customerLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#8a7b70' }}>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                      &nbsp; Loading customers...
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="cust-empty-state">
                      <Users size={36} />
                      <strong>No customers found</strong>
                      <span>{query ? `No results for "${query}"` : 'Customer records will appear after first payments are processed.'}</span>
                    </div>
                  ) : (
                    <div className="coupon-table-container">
                      <table className="coupon-table">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Orders</th>
                            <th>Total Spent</th>
                            <th>Last Visit</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((cust) => (
                            <tr key={cust.email} className="coupon-row cust-row" onClick={() => openCustomerDetail(cust)} style={{ cursor: 'pointer' }}>
                              <td>
                                <div className="cust-name-cell">
                                  <span className="cust-avatar">{cust.name.charAt(0).toUpperCase()}</span>
                                  <strong>{cust.name}</strong>
                                </div>
                              </td>
                              <td style={{ fontSize: '0.82rem', color: '#6c625a' }}>{cust.email}</td>
                              <td style={{ fontSize: '0.82rem', color: '#6c625a' }}>{cust.phone || '—'}</td>
                              <td><strong style={{ color: '#49352a' }}>{cust.total_orders}</strong></td>
                              <td><strong style={{ color: '#3b7d55' }}>₹{Number(cust.total_spent).toLocaleString('en-IN')}</strong></td>
                              <td style={{ fontSize: '0.78rem', color: '#8a7b70' }}>
                                {cust.last_visit ? new Date(cust.last_visit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                              <td>
                                {cust.payment_methods.map((pm) => (
                                  <span key={pm} className="coupon-code-badge" style={{ fontSize: '0.7rem', padding: '3px 7px', marginRight: '4px', textTransform: 'uppercase' }}>{pm}</span>
                                ))}
                              </td>
                              <td>
                                {cust.is_repeat
                                  ? <span className="badge badge--success">Repeat</span>
                                  : <span className="badge badge--warning">New</span>
                                }
                              </td>
                              <td><ChevronRight size={16} color="#9d8e84" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {activeTab === 'reports' && <ReportsPage />}
          </>
        )}
      </main>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="rejection-modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedCustomer(null)}>
          <div className="rejection-modal cust-detail-modal">
            <div className="cust-detail-header">
              <div className="cust-detail-avatar">{selectedCustomer.name.charAt(0).toUpperCase()}</div>
              <div className="cust-detail-info">
                <h3>{selectedCustomer.name}</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#8a7b70', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={13} /> {selectedCustomer.email}
                  </span>
                  {selectedCustomer.phone && (
                    <span style={{ fontSize: '0.82rem', color: '#8a7b70', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={13} /> {selectedCustomer.phone}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span className="badge badge--success">{selectedCustomer.total_orders} orders</span>
                  <span className="badge" style={{ background: '#f3ebe3', color: '#8b6045' }}>₹{Number(selectedCustomer.total_spent).toLocaleString('en-IN')} spent</span>
                  {selectedCustomer.is_repeat && <span className="badge" style={{ background: '#e8eef9', color: '#4473a8' }}>Repeat Customer</span>}
                </div>
              </div>
              <button className="cust-detail-close" onClick={() => setSelectedCustomer(null)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="cust-detail-body">
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#6c625a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Order History</h4>
              {customerOrdersLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#8a7b70' }}>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Loading orders...
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="cust-empty-state" style={{ padding: '30px' }}>
                  <PackagePlus size={28} />
                  <strong>No orders yet</strong>
                </div>
              ) : (
                <div className="cust-order-list">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="cust-order-row">
                      <div className="cust-order-row__top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#302b27' }}>{order.order_number}</strong>
                          <span className="coupon-code-badge" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                            {order.table ? order.table.name : 'Takeaway'}
                          </span>
                          <span className={`badge badge--${order.payment_status === 'paid' ? 'success' : 'warning'}`}>
                            {order.payment_status?.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.76rem', color: '#9d958e' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="cust-order-row__items">
                        {(order.items || []).map((item) => (
                          <span key={item.id} className="cust-item-tag">{item.quantity}× {item.product_name}</span>
                        ))}
                      </div>
                      <div className="cust-order-row__footer">
                        <div style={{ fontSize: '0.76rem', color: '#8a7b70', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                          {order.coupon_code && <span>Coupon: <strong>{order.coupon_code}</strong></span>}
                          {order.discount_amount > 0 && <span>Discount: <strong style={{ color: '#3b7d55' }}>-₹{order.discount_amount}</strong></span>}
                          <span>GST: ₹{order.gst?.toFixed(2)}</span>
                          {order.payment_method && <span>Via: <strong style={{ textTransform: 'uppercase' }}>{order.payment_method}</strong></span>}
                        </div>
                        <strong style={{ fontSize: '0.96rem', color: '#49352a' }}>₹{Number(order.final_total || order.total).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rejectionTarget && (
        <div className="rejection-modal-overlay">
          <div className="rejection-modal">
            <h3>Reject Employee Request</h3>
            <p>Are you sure you want to reject the staff request for <strong>{rejectionTarget.name}</strong>? Please provide a reason for the rejection (optional).</p>
            <form onSubmit={handleRejectEmployee}>
              <textarea
                placeholder="Reason for rejection (e.g. invalid employee code)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="rejection-modal-buttons">
                <button 
                  type="button" 
                  className="rejection-btn-cancel" 
                  onClick={() => {
                    setRejectionTarget(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rejection-btn-submit"
                  disabled={rejecting}
                >
                  {rejecting ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {removalTarget && (
        <div className="rejection-modal-overlay">
          <div className="rejection-modal">
            <h3>Remove Employee</h3>
            <p>Are you sure you want to remove <strong>{removalTarget.name}</strong> from the system? They will lose access to the portal immediately.</p>
            <div className="rejection-modal-buttons">
              <button 
                type="button" 
                className="rejection-btn-cancel" 
                onClick={() => setRemovalTarget(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="rejection-btn-submit"
                onClick={handleRemoveEmployee}
                disabled={removing}
              >
                {removing ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ProfileManagementModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={localUser} 
        onUpdateUser={(updated) => { setLocalUser(updated); refreshUser(updated); }} 
        apiService={authService} 
        roleLabel="Admin" 
      />
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric-card"><span><Icon size={20} /></span><small>{label}</small><strong>{value}</strong></div>;
}
