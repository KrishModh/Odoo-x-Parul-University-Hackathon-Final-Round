import { useEffect, useState } from 'react';
import { X, Search, Calendar, CreditCard, DollarSign, ShoppingBag, Clock, AlertCircle } from 'lucide-react';
import { fetchOrderHistory, fetchOrderStats } from '../../services/cashierService';
import { formatCurrency } from '../../utils/money';
import LoadingSpinner from '../LoadingSpinner';

export default function OrderHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, paid, pending

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

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredOrders = history.filter((order) => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.table?.name || 'Takeaway').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.payment_method || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'paid' && order.payment_status === 'paid') ||
      (statusFilter === 'pending' && order.payment_status === 'pending');

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

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal order-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <div>
            <span className="eyebrow">CASHIER CONSOLE</span>
            <h2>Order History & Analytics</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="pos-alert pos-alert--error" style={{ margin: '12px 0' }}>
            {error}
            <button onClick={loadData}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px 0' }}>
            <LoadingSpinner label="Retrieving order ledger..." />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {stats && (
              <div className="history-stats-grid">
                <div className="stats-card stats-card--coffee">
                  <div className="stats-card__icon"><DollarSign size={18} /></div>
                  <div className="stats-card__content">
                    <small>Total Revenue</small>
                    <strong>{formatCurrency(stats.total_revenue)}</strong>
                  </div>
                </div>
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

            {/* Filter Bar */}
            <div className="history-filters">
              <div className="history-search-input">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search order ID, table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="history-filter-tabs">
                <button 
                  className={statusFilter === 'all' ? 'is-active' : ''} 
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                <button 
                  className={statusFilter === 'paid' ? 'is-active' : ''} 
                  onClick={() => setStatusFilter('paid')}
                >
                  Paid
                </button>
                <button 
                  className={statusFilter === 'pending' ? 'is-active' : ''} 
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="history-orders-list">
              {filteredOrders.length === 0 ? (
                <div className="history-empty-state">
                  <AlertCircle size={32} />
                  <strong>No transactions found</strong>
                  <span>Try checking other search criteria or status filters.</span>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="history-order-row">
                    <div className="history-order-row__main">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{order.order_number}</strong>
                        <span className="history-order-row__table">
                          {order.table ? order.table.name : 'Takeaway'}
                        </span>
                      </div>
                      <small>{formatDate(order.created_at)} · {order.item_count} items</small>
                    </div>
                    
                    <div className="history-order-row__details">
                      <div className="history-order-row__amount">
                        {formatCurrency(order.total)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                        {order.payment_method && (
                          <span className="history-payment-method">
                            {order.payment_method.toUpperCase()}
                          </span>
                        )}
                        <span className={`history-status-badge history-status-badge--${order.payment_status}`}>
                          {order.payment_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
