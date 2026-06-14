import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import CategorySidebar from '../../components/pos/CategorySidebar';
import ProductCard from '../../components/pos/ProductCard';
import TableSelector from '../../components/pos/TableSelector';
import CartSummary from '../../components/pos/CartSummary';
import PaymentPanel from '../../components/pos/PaymentPanel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProfileManagementModal from '../../components/ProfileManagementModal';
import { useAuth } from '../../context/useAuth';
import POSLayout from '../../layouts/POSLayout';
import { createOrder, fetchPosBootstrap } from '../../services/posService';
import { createPaymentOrder, verifyPayment, processCashPayment, applyCouponCode } from '../../services/paymentService';
import { fetchOrderStats } from '../../services/cashierService';
import * as authService from '../../services/authService';
import OrderHistoryModal from '../../components/pos/OrderHistoryModal';
import { calculateCartTotals } from '../../utils/money';
import '../../css/pos/pos.css';

export default function POSPage() {
  const { user, logout, login, refreshUser } = useAuth();
  const [localUser, setLocalUser] = useState(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('profile');

  useEffect(() => {
    setLocalUser(user);
  }, [user]);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableSessions, setTableSessions] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);

  const totals = useMemo(() => {
    const baseTotals = calculateCartTotals(cart);
    if (!appliedCoupon) return baseTotals;

    const subtotal = baseTotals.subtotal;
    // Check if subtotal is below minimum order amount required by coupon
    if (subtotal < appliedCoupon.min_order_amount) {
      return {
        ...baseTotals,
        discount_amount: 0,
        final_total: baseTotals.total,
        coupon_error: `Min order ₹${appliedCoupon.min_order_amount} required`
      };
    }

    let discount_amount = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      discount_amount = parseFloat((subtotal * (appliedCoupon.discount_value / 100)).toFixed(2));
    } else {
      discount_amount = parseFloat(appliedCoupon.discount_value);
    }

    if (discount_amount > subtotal) {
      discount_amount = subtotal;
    }

    const gst = parseFloat(((subtotal - discount_amount) * 0.05).toFixed(2));
    const final_total = parseFloat((subtotal - discount_amount + gst).toFixed(2));

    return {
      ...baseTotals,
      discount_amount,
      gst,
      final_total
    };
  }, [cart, appliedCoupon]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory !== 'all') {
      result = result.filter((product) => product.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((product) => 
        (product.name || '').toLowerCase().includes(q) || 
        (product.category || '').toLowerCase().includes(q) ||
        (product.description || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, products, searchQuery]);

  const [stats, setStats] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [checkoutResetKey, setCheckoutResetKey] = useState(0);

  const resetCheckoutFlow = () => {
    if (selectedTable) {
      setTableSessions((prev) => {
        const next = { ...prev };
        delete next[selectedTable.id];
        return next;
      });
    }
    setCart([]);
    setSelectedTable(null);
    setCheckoutResetKey((prev) => prev + 1);
    setNotice('');
    setError('');
    setPaymentError('');
    setAppliedCoupon(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
  };

  const handleTableChange = (newTable) => {
    if (selectedTable) {
      setTableSessions((prev) => ({
        ...prev,
        [selectedTable.id]: {
          cart,
          appliedCoupon,
          customerName,
          customerEmail,
          customerPhone,
        }
      }));
    }

    if (newTable) {
      const session = tableSessions[newTable.id] || {
        cart: [],
        appliedCoupon: null,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
      };
      setCart(session.cart || []);
      setAppliedCoupon(session.appliedCoupon || null);
      setCustomerName(session.customerName || '');
      setCustomerEmail(session.customerEmail || '');
      setCustomerPhone(session.customerPhone || '');
    } else {
      setCart([]);
      setAppliedCoupon(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
    }
    
    setSelectedTable(newTable);
    setNotice('');
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponApplying(true);
    setCouponError('');
    try {
      const res = await applyCouponCode({
        code: couponCodeInput.trim(),
        subtotal: totals.subtotal
      });
      setAppliedCoupon({
        code: res.data.code,
        discount_type: res.data.discount_type,
        discount_value: res.data.discount_value,
        discount_amount: res.data.discount_amount,
        min_order_amount: res.data.min_order_amount || 0
      });
      setIsCouponModalOpen(false);
      setCouponCodeInput('');
      setNotice(`Coupon "${res.data.code}" applied successfully!`);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setNotice('Coupon removed.');
  };

  const loadStats = async () => {
    try {
      const statsData = await fetchOrderStats();
      setStats(statsData.data);
    } catch (e) {
      console.error('Failed to load order stats for badges:', e);
    }
  };

  const loadPos = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const data = await fetchPosBootstrap();
      
      const isFirstLoad = tables.length === 0;
      
      setTables(data.tables);
      setCategories(data.categories);
      setProducts(data.products);
      
      if (isFirstLoad) {
        const defaultTable = data.tables[0] || null;
        setSelectedTable(defaultTable);
        if (defaultTable) {
          const session = tableSessions[defaultTable.id] || {
            cart: [],
            appliedCoupon: null,
            customerName: '',
            customerEmail: '',
            customerPhone: '',
          };
          setCart(session.cart || []);
          setAppliedCoupon(session.appliedCoupon || null);
          setCustomerName(session.customerName || '');
          setCustomerEmail(session.customerEmail || '');
          setCustomerPhone(session.customerPhone || '');
        }
      } else {
        setSelectedTable((current) => {
          if (current) {
            const updated = data.tables.find((t) => t.id === current.id);
            return updated || current;
          }
          return null;
        });
      }
      await loadStats();
    } catch (requestError) {
      if (showSpinner) setError(requestError.response?.data?.message || 'Unable to load POS session.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadPos(true);
    
    // Set up a background sync poll (every 5 seconds) to automatically capture admin edits and stock changes live
    const interval = setInterval(() => {
      loadPos(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [tables.length]);

  const addToCart = (product) => {
    if (!selectedTable) {
      setNotice('Select a table before adding items.');
      return;
    }
    const quantity = product.quantity !== undefined ? product.quantity : (product.currentStock !== undefined ? product.currentStock : 0);
    const stockStatus = (product.stock_status || product.stockStatus || '').toUpperCase();
    if (quantity <= 0 || stockStatus === 'OUT_OF_STOCK') {
      setNotice('This item is out of stock.');
      return;
    }
    setNotice('');
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      let updated;
      if (existing) {
        if (existing.quantity >= quantity) {
          setNotice(`Only ${quantity} units of ${product.name} are available in stock.`);
          return items;
        }
        updated = items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        updated = [...items, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
      }
      
      setTableSessions((prev) => ({
        ...prev,
        [selectedTable.id]: {
          ...(prev[selectedTable.id] || { customerName: '', customerEmail: '', customerPhone: '', appliedCoupon: null }),
          cart: updated,
        }
      }));
      
      return updated;
    });
  };

  const increase = (id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const quantity = product.quantity !== undefined ? product.quantity : (product.currentStock !== undefined ? product.currentStock : 0);
    setCart((items) => {
      const existing = items.find((item) => item.id === id);
      if (existing && existing.quantity >= quantity) {
        setNotice(`Only ${quantity} units of ${product.name} are available in stock.`);
        return items;
      }
      const updated = items.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
      
      setTableSessions((prev) => ({
        ...prev,
        [selectedTable.id]: {
          ...(prev[selectedTable.id] || { customerName: '', customerEmail: '', customerPhone: '', appliedCoupon: null }),
          cart: updated,
        }
      }));
      
      return updated;
    });
  };

  const decrease = (id) => setCart((items) => {
    const updated = items.flatMap((item) => {
      if (item.id !== id) return [item];
      return item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [];
    });
    
    if (selectedTable) {
      setTableSessions((prev) => ({
        ...prev,
        [selectedTable.id]: {
          ...(prev[selectedTable.id] || { customerName: '', customerEmail: '', customerPhone: '', appliedCoupon: null }),
          cart: updated,
        }
      }));
    }
    
    return updated;
  });

  const remove = (id) => setCart((items) => {
    const updated = items.filter((item) => item.id !== id);
    
    if (selectedTable) {
      setTableSessions((prev) => ({
        ...prev,
        [selectedTable.id]: {
          ...(prev[selectedTable.id] || { customerName: '', customerEmail: '', customerPhone: '', appliedCoupon: null }),
          cart: updated,
        }
      }));
    }
    
    return updated;
  });

  const sendOrder = async () => {
    if (!selectedTable || !cart.length) return;
    setSubmitting(true);
    setNotice('');
    setError('');
    try {
      await createOrder({ table_id: selectedTable.id, items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })) });
      setCart([]);
      setNotice(`Order for ${selectedTable.name} saved to cart.`);
      loadPos();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save order.');
    } finally {
      setSubmitting(false);
    }
  };

  const [paymentState, setPaymentState] = useState('idle');
  const [paymentError, setPaymentError] = useState('');

  const handlePayment = async (method, customerDetails) => {
    if (!selectedTable) {
      setNotice('Select a table before initiating payment.');
      return;
    }
    if (!cart.length) {
      setNotice('Cart is empty. Add items to cart before initiating payment.');
      return;
    }

    // Double check coupon min order requirements before submitting
    if (appliedCoupon && totals.coupon_error) {
      setNotice(totals.coupon_error);
      return;
    }

    setNotice('');
    setError('');
    setPaymentError('');
    setPaymentState('creating');

    if (method === 'cash') {
      try {
        await processCashPayment({
          table_id: selectedTable.id,
          items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
          coupon_code: appliedCoupon ? appliedCoupon.code : null
        });

        setPaymentState('success');
        resetCheckoutFlow();
        loadStats();
        loadPos();
        setTimeout(() => {
          setPaymentState('idle');
        }, 2000);
      } catch (requestError) {
        setPaymentError(requestError.response?.data?.message || 'Failed to process cash payment.');
        setPaymentState('failed');
      }
    } else {
      try {
        const data = await createPaymentOrder({
          table_id: selectedTable.id,
          items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
          coupon_code: appliedCoupon ? appliedCoupon.code : null
        });

        setPaymentState('checkout');

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY || data.razorpay_key,
          amount: data.amount,
          currency: data.currency,
          name: 'Velluto Cafe',
          description: `Table ${selectedTable.name} Order Payment (ONLINE)`,
          image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=100&h=100&q=80',
          order_id: data.order_id,
          handler: async (response) => {
            setPaymentState('verifying');
            try {
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              setPaymentState('success');
              resetCheckoutFlow();
              loadStats();
              loadPos();
              setTimeout(() => {
                setPaymentState('idle');
              }, 2000);
            } catch (verifyError) {
              setPaymentError(verifyError.response?.data?.message || 'Payment signature verification failed.');
              setPaymentState('failed');
            }
          },
          prefill: {
            name: customerDetails.name || user?.name || 'Cashier',
            email: customerDetails.email || user?.email || 'cashier@velluto.com',
            contact: customerDetails.phone || '',
          },
          theme: {
            color: '#49352a',
          },
          modal: {
            ondismiss: () => {
              setPaymentState('idle');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (requestError) {
        setPaymentError(requestError.response?.data?.message || 'Failed to initialize payment.');
        setPaymentState('failed');
      }
    }
  };

  const handleLogout = () => {
    logout();
    window.location.assign('/login');
  };

  return (
    <>
      <POSLayout 
        selectedTable={selectedTable} 
        user={localUser} 
        onLogout={handleLogout} 
        stats={stats} 
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenProfile={() => { setIsProfileModalOpen(true); }}
        onOpenPassword={() => { setIsProfileModalOpen(true); }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <main className="pos-main">
          <TableSelector tables={tables} selectedTableId={selectedTable?.id} onSelect={handleTableChange} tableSessions={tableSessions} />
          {(notice || error) && <div className={`pos-alert ${error ? 'pos-alert--error' : ''}`}>{error || notice}<button onClick={error ? loadPos : () => setNotice('')}><RefreshCw size={15} />{error ? 'Retry' : 'Clear'}</button></div>}
          {loading ? <div className="pos-loader"><LoadingSpinner label="Opening POS session..." /></div> : (
            <section className="pos-workspace">
              <CategorySidebar categories={categories} activeCategory={activeCategory} onChange={setActiveCategory} />
              <section className="product-section">
                <div className="pos-section-heading"><div><span className="eyebrow">MENU</span><h2>{activeCategory === 'all' ? 'All products' : categories.find((category) => category.slug === activeCategory)?.name}</h2></div><span>{filteredProducts.length} products</span></div>
                {filteredProducts.length === 0 ? (
                  <div className="cart-empty" style={{ margin: '16px 0', border: '1px dashed #dccfc2', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <strong>No products found</strong>
                    <span>Try searching for another item or category.</span>
                  </div>
                ) : (
                  <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} disabled={!selectedTable} />)}</div>
                )}
              </section>
              <aside className="pos-right-panel">
                <CartSummary 
                  items={cart} 
                  totals={totals} 
                  selectedTable={selectedTable} 
                  onIncrease={increase} 
                  onDecrease={decrease} 
                  onRemove={remove} 
                  onSend={sendOrder} 
                  submitting={submitting}
                  appliedCoupon={appliedCoupon}
                  onOpenCouponModal={() => setIsCouponModalOpen(true)}
                  onRemoveCoupon={handleRemoveCoupon}
                />
                <div className="pos-right-panel__separator" />
                <PaymentPanel 
                  key={`${selectedTable ? selectedTable.id : 'none'}-${checkoutResetKey}`} 
                  onPay={handlePayment} 
                  disabled={!selectedTable || !cart.length}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmail}
                  customerPhone={customerPhone}
                  setCustomerPhone={setCustomerPhone}
                />
              </aside>
            </section>
          )}
        </main>

        {paymentState !== 'idle' && (
          <div className="payment-overlay">
            {paymentState === 'creating' && (
              <div className="payment-modal">
                <div className="payment-modal__spinner"></div>
                <h3>Processing Transaction</h3>
                <p>Preparing transaction details. Please wait...</p>
              </div>
            )}

            {paymentState === 'verifying' && (
              <div className="payment-modal">
                <div className="payment-modal__spinner"></div>
                <h3>Verifying Payment</h3>
                <p>Confirming transaction signature and sending receipt. Do not close this window...</p>
              </div>
            )}

            {paymentState === 'success' && (
              <div className="payment-modal">
                <div className="payment-modal__icon payment-modal__icon--success">
                  <CheckCircle2 size={38} />
                </div>
                <h3>Payment Successful!</h3>
                <p>The transaction completed successfully. The tax invoice has been sent to the customer's email.</p>
                <button className="payment-modal__btn--success" onClick={() => setPaymentState('idle')}>Done</button>
              </div>
            )}

            {paymentState === 'failed' && (
              <div className="payment-modal">
                <div className="payment-modal__icon payment-modal__icon--failed">
                  <XCircle size={38} />
                </div>
                <h3>Payment Failed</h3>
                <p>{paymentError || 'Something went wrong during payment. Please try again.'}</p>
                <button className="payment-modal__btn--failed" onClick={() => setPaymentState('idle')}>Close</button>
              </div>
            )}
          </div>
        )}

        <OrderHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

        {isCouponModalOpen && (
          <div className="payment-overlay">
            <div className="payment-modal">
              <h3>Apply Coupon Code</h3>
              <p>Enter a valid coupon code to get a discount on this order.</p>
              <form onSubmit={handleApplyCoupon}>
                <div className="form-field" style={{ marginBottom: '20px' }}>
                  <div className="form-field__control" style={{ textTransform: 'uppercase' }}>
                    <input
                      required
                      autoFocus
                      placeholder="e.g. WELCOME10"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value.toUpperCase().replace(/\s+/g, ''));
                        setCouponError('');
                      }}
                      style={{ textAlign: 'center', letterSpacing: '0.05em', fontWeight: 'bold' }}
                    />
                  </div>
                  {couponError && <span className="form-field__error">{couponError}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    className="payment-modal__btn--failed"
                    onClick={() => {
                      setIsCouponModalOpen(false);
                      setCouponCodeInput('');
                      setCouponError('');
                    }}
                    style={{ background: '#eee7df', color: '#49352a' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="payment-modal__btn--success"
                    disabled={couponApplying || !couponCodeInput.trim()}
                    style={{ background: '#547662' }}
                  >
                    {couponApplying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </POSLayout>
      <ProfileManagementModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={localUser} 
        onUpdateUser={(updated) => { setLocalUser(updated); refreshUser(updated); }} 
        apiService={authService} 
        roleLabel="Cashier" 
      />
    </>
  );
}

