import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import '../../css/shared/dashboard.css';
import { UtensilsCrossed, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchKitchenOrders, updateKitchenOrderStatus } from '../../services/kitchenService';

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores order ID currently transitioning

  const loadOrders = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await fetchKitchenOrders();
      setOrders(response.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
      setError('Failed to load orders. Retrying...');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);

    // Auto refresh every 5 seconds
    const interval = setInterval(() => {
      loadOrders(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      await updateKitchenOrderStatus(orderId, newStatus);
      await loadOrders(false);
    } catch (err) {
      console.error(`Failed to update status for order ${orderId}:`, err);
      alert(err.response?.data?.message || 'Failed to update order stage.');
    } finally {
      setActionLoading(null);
    }
  };

  const toCookOrders = orders.filter((o) => o.kitchen_status === 'to_cook');
  const preparingOrders = orders.filter((o) => o.kitchen_status === 'preparing');
  const completedOrders = orders.filter((o) => o.kitchen_status === 'completed');

  const formatOrderTime = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  return (
    <MainLayout title="Kitchen Display System">
      <style>{`
        .kitchen-column {
          background: rgba(253, 251, 247, 0.9);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 70vh;
        }
        .kitchen-column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid #eee7df;
          margin-bottom: 6px;
        }
        .kitchen-column-header h3 {
          font-family: 'DM Sans', sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
          color: #49352a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .kitchen-column-badge {
          background: #eee7df;
          color: #7d756f;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .kitchen-order-card {
          background: white;
          border: 1px solid #eee7df;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 15px rgba(64, 47, 36, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .kitchen-order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(64, 47, 36, 0.05);
        }
        .kitchen-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .kitchen-card-id {
          font-size: 0.85rem;
          font-weight: 800;
          color: #49352a;
        }
        .kitchen-card-time {
          font-size: 0.7rem;
          font-weight: 700;
          color: #9d958e;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kitchen-card-table {
          background: #f3ebe3;
          color: #8b6045;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .kitchen-card-customer {
          font-size: 0.78rem;
          font-weight: 700;
          color: #7d756f;
        }
        .kitchen-card-items {
          border-top: 1px dashed #eee7df;
          border-bottom: 1px dashed #eee7df;
          padding: 10px 0;
          margin: 2px 0;
          display: grid;
          gap: 6px;
        }
        .kitchen-card-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: #302b27;
        }
        .kitchen-card-item-qty {
          background: #f7f5f0;
          border: 1px solid #e7e1d8;
          border-radius: 6px;
          min-width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 0.75rem;
          color: #49352a;
        }
        .kitchen-card-item-name {
          flex: 1;
          margin-left: 10px;
          font-weight: 600;
        }
        .kitchen-card-total {
          font-size: 0.82rem;
          font-weight: 700;
          color: #49352a;
          display: flex;
          justify-content: space-between;
        }
        .kitchen-card-btn {
          width: 100%;
          min-height: 44px;
          border: 0;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .kitchen-card-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(0.95);
        }
        .kitchen-card-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .kitchen-card-btn--tocook {
          background: var(--espresso);
          color: white;
        }
        .kitchen-card-btn--preparing {
          background: var(--sage);
          color: white;
        }
        .kitchen-empty-state {
          flex: 1;
          border: 2px dashed #ded8cf;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          text-align: center;
          color: #9d958e;
        }
        .kitchen-empty-state strong {
          display: block;
          color: #49352a;
          font-size: 0.88rem;
          margin-top: 8px;
        }
        .kitchen-empty-state span {
          font-size: 0.74rem;
        }
        .completed-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #547662;
          background: #e3eee7;
          padding: 4px 8px;
          border-radius: 8px;
        }
      `}</style>

      {error && (
        <div className="dashboard-notice" style={{ border: '1px solid #e9c1bc', color: '#96473e', background: '#fff1ee' }}>
          <span>{error}</span>
          <button onClick={() => loadOrders(true)} style={{ color: 'inherit' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="dashboard-loader">
          <div className="loading-spinner__ring" style={{ width: '30px', height: '30px' }}></div>
          <span style={{ marginTop: '12px', display: 'block', fontWeight: 600 }}>Loading orders...</span>
        </div>
      ) : (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '0px' }}>
          
          {/* Incoming Column */}
          <div className="kitchen-column">
            <div className="kitchen-column-header">
              <h3>
                <UtensilsCrossed size={18} color="#c77a5f" />
                To Cook
              </h3>
              <span className="kitchen-column-badge">{toCookOrders.length}</span>
            </div>
            {toCookOrders.length === 0 ? (
              <div className="kitchen-empty-state">
                <UtensilsCrossed size={28} />
                <strong>No Orders Pending</strong>
                <span>New incoming cashier orders will appear here.</span>
              </div>
            ) : (
              toCookOrders.map((order) => (
                <div key={order.id} className="kitchen-order-card">
                  <div className="kitchen-card-meta">
                    <span className="kitchen-card-id">{order.order_number}</span>
                    <span className="kitchen-card-table">
                      {order.table ? order.table.name : 'Takeaway'}
                    </span>
                  </div>
                  <div className="kitchen-card-meta">
                    <span className="kitchen-card-customer">
                      Customer: {order.customer_name || 'Guest'}
                    </span>
                    <span className="kitchen-card-time">
                      <Clock size={12} /> {formatOrderTime(order.created_at)}
                    </span>
                  </div>
                  <div className="kitchen-card-items">
                    {order.items.map((item) => (
                      <div key={item.id} className="kitchen-card-item">
                        <span className="kitchen-card-item-qty">{item.quantity}</span>
                        <span className="kitchen-card-item-name">{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="kitchen-card-total">
                    <span>Total Bill:</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                  <button
                    className="kitchen-card-btn kitchen-card-btn--tocook"
                    onClick={() => handleStatusChange(order.id, 'preparing')}
                    disabled={actionLoading === order.id}
                  >
                    {actionLoading === order.id ? 'Starting...' : 'Start Preparing'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Preparing Column */}
          <div className="kitchen-column">
            <div className="kitchen-column-header">
              <h3>
                <Clock size={18} color="#a87857" />
                Preparing
              </h3>
              <span className="kitchen-column-badge">{preparingOrders.length}</span>
            </div>
            {preparingOrders.length === 0 ? (
              <div className="kitchen-empty-state">
                <Clock size={28} />
                <strong>No Active Items</strong>
                <span>Items currently being prepared will show here.</span>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div key={order.id} className="kitchen-order-card">
                  <div className="kitchen-card-meta">
                    <span className="kitchen-card-id">{order.order_number}</span>
                    <span className="kitchen-card-table">
                      {order.table ? order.table.name : 'Takeaway'}
                    </span>
                  </div>
                  <div className="kitchen-card-meta">
                    <span className="kitchen-card-customer">
                      Customer: {order.customer_name || 'Guest'}
                    </span>
                    <span className="kitchen-card-time">
                      Started: {formatOrderTime(order.kitchen_started_at)}
                    </span>
                  </div>
                  <div className="kitchen-card-items">
                    {order.items.map((item) => (
                      <div key={item.id} className="kitchen-card-item">
                        <span className="kitchen-card-item-qty">{item.quantity}</span>
                        <span className="kitchen-card-item-name">{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="kitchen-card-total">
                    <span>Total Bill:</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                  <button
                    className="kitchen-card-btn kitchen-card-btn--preparing"
                    onClick={() => handleStatusChange(order.id, 'completed')}
                    disabled={actionLoading === order.id}
                  >
                    {actionLoading === order.id ? 'Completing...' : 'Mark Completed'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Completed Column */}
          <div className="kitchen-column">
            <div className="kitchen-column-header">
              <h3>
                <CheckCircle size={18} color="#547662" />
                Completed
              </h3>
              <span className="kitchen-column-badge">{completedOrders.length}</span>
            </div>
            {completedOrders.length === 0 ? (
              <div className="kitchen-empty-state">
                <CheckCircle size={28} />
                <strong>No Completed Orders</strong>
                <span>Orders ready to serve will be shown here.</span>
              </div>
            ) : (
              completedOrders.map((order) => (
                <div key={order.id} className="kitchen-order-card" style={{ opacity: 0.85 }}>
                  <div className="kitchen-card-meta">
                    <span className="kitchen-card-id">{order.order_number}</span>
                    <span className="kitchen-card-table">
                      {order.table ? order.table.name : 'Takeaway'}
                    </span>
                  </div>
                  <div className="kitchen-card-meta">
                    <span className="kitchen-card-customer">
                      Customer: {order.customer_name || 'Guest'}
                    </span>
                    <span className="completed-badge">
                      <CheckCircle size={12} /> Ready
                    </span>
                  </div>
                  <div className="kitchen-card-items">
                    {order.items.map((item) => (
                      <div key={item.id} className="kitchen-card-item">
                        <span className="kitchen-card-item-qty">{item.quantity}</span>
                        <span className="kitchen-card-item-name">{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="kitchen-card-total">
                    <span>Ready at:</span>
                    <strong>{formatOrderTime(order.kitchen_completed_at)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </MainLayout>
  );
}
