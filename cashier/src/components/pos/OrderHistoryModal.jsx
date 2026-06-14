import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X, Search, Calendar, CreditCard, DollarSign, ShoppingBag, Clock, AlertCircle, Lock } from 'lucide-react';
import { fetchOrderHistory, fetchOrderStats, cancelOrder } from '../../services/cashierService';
import { formatCurrency } from '../../utils/money';
import LoadingSpinner from '../LoadingSpinner';

export default function OrderHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isClosing, setIsClosing] = useState(false);
  const searchInputRef = useRef(null);
  const overlayRef = useRef(null);

  // Cancellation states
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const confirmCancel = (order) => {
    setCancellingOrder(order);
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancellingLoading(true);
    try {
      await cancelOrder(cancellingOrder.id);
      setCancellingOrder(null);
      // Reload order list
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancellingLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setSearchQuery('');
      setStatusFilter('all');
      onClose();
    }, 220);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetchOrderHistory(),
        fetchOrderStats(),
      ]);
      setHistory(historyResponse.data);
      setStats(statsResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens; restore body scroll on close
  useEffect(() => {
    if (isOpen) {
      loadData();
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const filteredOrders = history.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (order.order_number || '').toLowerCase().includes(q) ||
      (order.table?.name || 'Takeaway').toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.payment_method || '').toLowerCase().includes(q);

    const matchesStatus =
      (statusFilter === 'all' && order.status !== 'cancelled') ||
      (statusFilter === 'paid' && order.payment_status === 'paid' && order.status !== 'cancelled') ||
      (statusFilter === 'pending' && order.payment_status === 'pending' && order.status !== 'cancelled') ||
      (statusFilter === 'cancelled' && order.status === 'cancelled');

    return matchesSearch && matchesStatus;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  return (
    <div
      ref={overlayRef}
      className={`oh-overlay${isClosing ? ' oh-overlay--closing' : ''}`}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Order History & Analytics"
    >
      <div className={`oh-modal${isClosing ? ' oh-modal--closing' : ''}`}>

        {/* ── Sticky Top Navigation Bar ── */}
        <div className="oh-nav">
          {/* LEFT: back button + title */}
          <div className="oh-nav__left">
            <button
              className="oh-nav__back"
              onClick={handleClose}
              aria-label="Go back"
              title="Close (Esc)"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="oh-nav__title-group">
              <span className="oh-nav__eyebrow">CASHIER CONSOLE</span>
              <h2 className="oh-nav__title">Order History & Analytics</h2>
            </div>
          </div>

          {/* CENTER: search bar */}
          <div className="oh-nav__search">
            <Search size={16} className="oh-nav__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="oh-nav__search-input"
              placeholder="Search orders, tables, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search orders"
            />
            {searchQuery && (
              <button
                className="oh-nav__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* RIGHT: close button */}
          <button
            className="oh-nav__close"
            onClick={handleClose}
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="oh-body">
          {error && (
            <div className="pos-alert pos-alert--error" style={{ margin: '0 0 16px' }}>
              {error}
              <button onClick={loadData}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="oh-loading">
              <LoadingSpinner label="Retrieving order ledger..." />
            </div>
          ) : (
            <>
              {/* Analytics Cards */}
              {stats && (
                <div className="history-stats-grid">
                  <div className="stats-card stats-card--sage">
                    <div className="stats-card__icon"><ShoppingBag size={18} /></div>
                    <div className="stats-card__content">
                      <small>Total Orders</small>
                      <strong>{stats.total_orders}</strong>
                    </div>
                  </div>
                  <div className="stats-card stats-card--peach">
                    <div className="stats-card__icon"><Calendar size={18} /></div>
                    <div className="stats-card__content">
                      <small>Today's Orders</small>
                      <strong>{stats.todays_orders}</strong>
                    </div>
                  </div>
                  <div className="stats-card stats-card--blue">
                    <div className="stats-card__icon"><CreditCard size={18} /></div>
                    <div className="stats-card__content">
                      <small>Today's Sales</small>
                      <strong>{formatCurrency(stats.todays_revenue)}</strong>
                    </div>
                  </div>
                  <div className="stats-card stats-card--orange">
                    <div className="stats-card__icon"><Clock size={18} /></div>
                    <div className="stats-card__content">
                      <small>Pending Bills</small>
                      <strong>{stats.pending_payments}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="oh-filter-bar">
                <div className="oh-results-count">
                  {filteredOrders.length === history.length
                    ? `${history.length} transactions`
                    : `${filteredOrders.length} of ${history.length} transactions`}
                </div>
                <div className="history-filter-tabs">
                  <button
                    className={statusFilter === 'all' ? 'is-active' : ''}
                    onClick={() => setStatusFilter('all')}
                  >All</button>
                  <button
                    className={statusFilter === 'paid' ? 'is-active' : ''}
                    onClick={() => setStatusFilter('paid')}
                  >Paid</button>
                  <button
                    className={statusFilter === 'pending' ? 'is-active' : ''}
                    onClick={() => setStatusFilter('pending')}
                  >Pending</button>
                  <button
                    className={statusFilter === 'cancelled' ? 'is-active' : ''}
                    onClick={() => setStatusFilter('cancelled')}
                  >Cancelled</button>
                </div>
              </div>

              {/* Orders List */}
              <div className="history-orders-list">
                {filteredOrders.length === 0 ? (
                  <div className="history-empty-state">
                    <AlertCircle size={32} />
                    <strong>No transactions found</strong>
                    <span>
                      {searchQuery
                        ? `No results for "${searchQuery}".`
                        : 'Try checking other status filters.'}
                    </span>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const isCancelled = order.status === 'cancelled';
                    return (
                      <div 
                        key={order.id} 
                        className={`history-order-row ${isCancelled ? 'history-order-row--cancelled' : ''}`}
                        style={isCancelled ? { opacity: 0.55, borderLeft: '4px solid #96473e', background: '#fffcfc' } : {}}
                      >
                        <div className="history-order-row__main">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>{order.order_number}</strong>
                            <span className="history-order-row__table">
                              {order.table ? order.table.name : 'Takeaway'}
                            </span>
                            {order.customer_name && (
                              <span className="oh-customer-tag">{order.customer_name}</span>
                            )}
                          </div>
                          <small>{formatDate(order.created_at)} · {order.item_count} items</small>
                        </div>

                        <div className="history-order-row__details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div className="history-order-row__amount">
                            {formatCurrency(order.total)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                            {order.payment_method && (
                              <span className="history-payment-method">
                                {order.payment_method.toUpperCase()}
                              </span>
                            )}
                            {isCancelled ? (
                              <span className="history-status-badge history-status-badge--cancelled" style={{ backgroundColor: '#fff1ee', color: '#96473e', borderColor: '#e9c1bc' }}>
                                CANCELLED
                              </span>
                            ) : (
                              <span className={`history-status-badge history-status-badge--${order.payment_status}`}>
                                {order.payment_status.toUpperCase()}
                              </span>
                            )}
                          </div>
                          {!isCancelled && (order.kitchen_status === 'preparing' || order.kitchen_status === 'completed') ? (
                            <button
                              className="coupon-action-btn coupon-action-btn--delete"
                              disabled
                              style={{ 
                                marginTop: '8px', 
                                padding: '4px 10px', 
                                fontSize: '0.74rem', 
                                border: '1px solid #e7e1d8', 
                                borderRadius: '8px', 
                                cursor: 'not-allowed', 
                                background: '#f5f0eb', 
                                color: '#9c8e84',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Lock size={11} /> Kitchen Accepted
                            </button>
                          ) : !isCancelled && (
                            <button
                              className="coupon-action-btn coupon-action-btn--delete"
                              onClick={() => confirmCancel(order)}
                              style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.74rem', border: '1px solid #f7e6e3', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .cancel-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: cancelFadeIn 0.2s ease-out forwards;
        }

        .cancel-modal-card {
          background: #fffdf9;
          border: 1px solid #eee7df;
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 40px rgba(64, 47, 36, 0.16);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          animation: cancelScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes cancelFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cancelScaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .cancel-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          border: 0;
          background: transparent;
          color: #9c8e84;
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 4px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .cancel-modal-close:hover {
          background: #fff1ee;
          color: #a15950;
        }

        .cancel-modal-header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          text-align: left;
        }

        .cancel-modal-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #fff1ee;
          color: #96473e;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .cancel-modal-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-right: 24px;
        }

        .cancel-modal-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #3b2b22;
        }

        .cancel-modal-subtitle {
          margin: 0;
          font-size: 0.84rem;
          color: #8a7b70;
          line-height: 1.4;
        }

        .cancel-warning-box {
          background: #fff1ee;
          border: 1px solid #e9c1bc;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }

        .cancel-warning-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: #96473e;
          font-weight: 800;
        }

        .cancel-warning-item::before {
          content: '•';
          font-weight: bold;
        }

        .cancel-modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .cancel-btn {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          font-size: 0.84rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cancel-btn--keep {
          background: white;
          border: 1px solid #e7e1d8;
          color: #55473e;
        }

        .cancel-btn--keep:hover:not(:disabled) {
          background: #fdfcf9;
          border-color: #cdb8a8;
        }

        .cancel-btn--confirm {
          background: linear-gradient(135deg, #a15950, #b05a50);
          border: 0;
          color: white;
          box-shadow: 0 4px 12px rgba(161, 89, 80, 0.2);
        }

        .cancel-btn--confirm:hover:not(:disabled) {
          background: linear-gradient(135deg, #b05a50, #c4685e);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(161, 89, 80, 0.28);
        }

        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .cancel-modal-card {
            max-width: 92vw;
          }
        }
      `}</style>

      {cancellingOrder && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal-card">
            <button className="cancel-modal-close" onClick={() => setCancellingOrder(null)} aria-label="Close">
              <X size={18} />
            </button>
            
            <div className="cancel-modal-header">
              <div className="cancel-modal-icon-wrapper">
                <AlertCircle size={20} />
              </div>
              <div className="cancel-modal-title-group">
                <h3 className="cancel-modal-title">Cancel Order?</h3>
                <p className="cancel-modal-subtitle">
                  This action will remove the order from kitchen queue and restore stock quantities.
                </p>
              </div>
            </div>

            <div className="cancel-warning-box">
              <div className="cancel-warning-item">Product stock quantities will be restored</div>
              <div className="cancel-warning-item">Orders will be removed from cooking queues</div>
              <div className="cancel-warning-item">This action cannot be undone</div>
            </div>

            <div className="cancel-modal-buttons">
              <button 
                type="button" 
                className="cancel-btn cancel-btn--keep" 
                onClick={() => setCancellingOrder(null)}
                disabled={cancellingLoading}
              >
                Keep Order
              </button>
              <button 
                type="button" 
                className="cancel-btn cancel-btn--confirm"
                onClick={handleCancelOrder}
                disabled={cancellingLoading}
              >
                {cancellingLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
