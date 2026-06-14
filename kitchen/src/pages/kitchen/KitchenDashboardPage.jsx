import React, { useCallback, useEffect, useRef, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import ProfileManagementModal from '../../components/ProfileManagementModal';
import * as authService from '../../services/authService';
import '../../css/shared/dashboard.css';
import { useAuth } from '../../context/useAuth';

import {
  AlertCircle, Bell, BellOff, CheckCircle, ChefHat, Clock,
  Coffee, Package, RefreshCw, Search, Settings, Utensils,
  UtensilsCrossed, Zap,
} from 'lucide-react';
import {
  fetchKitchenMenu,
  fetchKitchenOrders,
  fetchKitchenStats,
  updateKitchenOrderStatus,
} from '../../services/kitchenService';

/* ─── Toast helper ─── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

/* ─── Skeleton card ─── */
function SkeletonCard() {
  return (
    <div className="kds-skeleton-card">
      <div className="kds-skeleton kds-skeleton--title" />
      <div className="kds-skeleton kds-skeleton--line" />
      <div className="kds-skeleton kds-skeleton--line kds-skeleton--short" />
      <div className="kds-skeleton kds-skeleton--items" />
      <div className="kds-skeleton kds-skeleton--btn" />
    </div>
  );
}

/* ─── Order card ─── */
function OrderCard({ order, onAction, actionLoading, searchQuery }) {
  const isLoading = actionLoading === order.id;

  const formatTime = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '—'; }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  const highlight = (text) => {
    if (!searchQuery || !text) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: '#fde68a', borderRadius: '2px', padding: '0 1px' }}>
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  return (
    <div className={`kds-card kds-card--${order.kitchen_status}`}>
      {/* Card header */}
      <div className="kds-card__header">
        <div className="kds-card__id-row">
          <span className="kds-card__id">{highlight(order.order_number)}</span>
          <span className="kds-card__table">{highlight(order.table ? order.table.name : 'Takeaway')}</span>
        </div>
        <div className="kds-card__meta-row">
          <span className="kds-card__customer">
            {order.customer_name ? highlight(order.customer_name) : <span style={{ color: '#aaa' }}>Guest</span>}
          </span>
          <span className="kds-card__time">
            <Clock size={12} />
            {order.kitchen_status === 'preparing'
              ? `Started ${formatTime(order.kitchen_started_at)}`
              : formatTime(order.created_at)}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="kds-card__items">
        {(order.items || []).map((item) => (
          <div key={item.id} className="kds-card__item">
            <span className="kds-card__item-qty">{item.quantity}</span>
            <span className="kds-card__item-name">{highlight(item.product_name)}</span>
            <span className="kds-card__item-price">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.line_total || 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="kds-card__total">
        <span>Total Bill</span>
        <strong>{formatCurrency(order.final_total || order.total)}</strong>
      </div>

      {/* Action button */}
      {order.kitchen_status !== 'completed' && (
        <button
          className={`kds-card__btn kds-card__btn--${order.kitchen_status}`}
          onClick={() => onAction(order.id, order.kitchen_status === 'to_cook' ? 'preparing' : 'completed')}
          disabled={isLoading}
        >
          {isLoading
            ? <><div className="kds-spinner" /> {order.kitchen_status === 'to_cook' ? 'Starting...' : 'Completing...'}</>
            : order.kitchen_status === 'to_cook'
              ? <><Zap size={16} /> Start Preparing</>
              : <><CheckCircle size={16} /> Mark Completed</>
          }
        </button>
      )}
      {order.kitchen_status === 'completed' && (
        <div className="kds-card__ready-badge">
          <CheckCircle size={14} /> Ready to Serve
        </div>
      )}
    </div>
  );
}

/* ─── Display System Tab ─── */
function DisplaySystemTab({ orders, actionLoading, onAction, searchQuery, refreshInterval, loading }) {
  const q = (searchQuery || '').toLowerCase();

  const filterOrders = (list) => {
    if (!q) return list;
    return list.filter((o) =>
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.table?.name || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.items || []).some((i) => (i.product_name || '').toLowerCase().includes(q))
    );
  };

  const toCook = filterOrders(orders.filter((o) => o.kitchen_status === 'to_cook'));
  const preparing = filterOrders(orders.filter((o) => o.kitchen_status === 'preparing'));
  const completed = filterOrders(orders.filter((o) => o.kitchen_status === 'completed'));

  const column = (title, icon, colorClass, items, emptyMsg, emptyHint) => (
    <div className={`kds-column kds-column--${colorClass}`}>
      <div className="kds-column__header">
        <h3 className="kds-column__title">
          {icon}
          {title}
        </h3>
        <span className="kds-column__badge">{items.length}</span>
      </div>
      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : items.length === 0 ? (
        <div className="kds-empty">
          {icon}
          <strong>{emptyMsg}</strong>
          <span>{emptyHint}</span>
        </div>
      ) : (
        items.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onAction={onAction}
            actionLoading={actionLoading}
            searchQuery={searchQuery}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="kds-board">
      {column('To Cook', <UtensilsCrossed size={18} />, 'tocook',
        toCook, 'No Pending Orders', 'New cashier orders will appear here.')}
      {column('Preparing', <Clock size={18} />, 'preparing',
        preparing, 'Nothing In Progress', 'Items being cooked will show here.')}
      {column('Completed', <CheckCircle size={18} />, 'completed',
        completed, 'No Ready Orders', 'Completed dishes will appear here.')}
    </div>
  );
}

/* ─── Completed Tab ─── */
function CompletedTab({ orders, searchQuery }) {
  const q = (searchQuery || '').toLowerCase();
  const completed = orders
    .filter((o) => o.kitchen_status === 'completed')
    .filter((o) =>
      !q ||
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.table?.name || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q)
    )
    .sort((a, b) => new Date(b.kitchen_completed_at || 0) - new Date(a.kitchen_completed_at || 0));

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  return (
    <div>
      <div className="kds-tab-heading">
        <div>
          <h2>Completed Orders</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            {completed.length} order{completed.length !== 1 ? 's' : ''} ready to serve
          </p>
        </div>
        <span className="kds-tab-count">{completed.length}</span>
      </div>

      {completed.length === 0 ? (
        <div className="kds-tab-empty">
          <CheckCircle size={40} />
          <strong>No completed orders yet</strong>
          <span>{q ? `No match for "${searchQuery}"` : 'Mark orders as completed from the Display System tab.'}</span>
        </div>
      ) : (
        <div className="kds-completed-list">
          {completed.map((order) => (
            <div key={order.id} className="kds-completed-row">
              <div className="kds-completed-row__left">
                <span className="kds-card__id">{order.order_number}</span>
                <span className="kds-card__table">{order.table ? order.table.name : 'Takeaway'}</span>
                {order.customer_name && (
                  <span className="kds-completed-row__customer">{order.customer_name}</span>
                )}
              </div>
              <div className="kds-completed-row__center">
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {(order.items || []).map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}
                </span>
              </div>
              <div className="kds-completed-row__right">
                <strong>{formatCurrency(order.final_total || order.total)}</strong>
                <span className="kds-ready-badge">
                  <CheckCircle size={12} />
                  Ready — {formatTime(order.kitchen_completed_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Menu Items Tab ─── */
function MenuItemsTab({ searchQuery }) {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const loadMenu = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchKitchenMenu();
      setMenu(res.data?.data || []);
      setCategories(res.data?.categories || []);
    } catch (err) {
      setError('Could not load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMenu(); }, []);

  const q = (searchQuery || '').toLowerCase();
  const filtered = menu
    .filter((p) => activeCat === 'all' || p.category === activeCat)
    .filter((p) =>
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  return (
    <div>
      <div className="kds-tab-heading">
        <div>
          <h2>Menu Items</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Read-only view of active menu</p>
        </div>
        <button className="icon-button" onClick={loadMenu} title="Refresh menu">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="dashboard-notice" style={{ borderColor: '#e9c1bc', color: '#96473e', background: '#fff1ee' }}>
          <span>{error}</span>
          <button onClick={loadMenu}><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {/* Category filter chips */}
      {!loading && categories.length > 0 && (
        <div className="kds-cat-chips">
          <button
            className={`kds-cat-chip ${activeCat === 'all' ? 'kds-cat-chip--active' : ''}`}
            onClick={() => setActiveCat('all')}
          >
            All ({menu.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`kds-cat-chip ${activeCat === cat ? 'kds-cat-chip--active' : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat} ({menu.filter((p) => p.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="kds-menu-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="kds-skeleton-card kds-skeleton-card--menu">
              <div className="kds-skeleton kds-skeleton--img" />
              <div className="kds-skeleton kds-skeleton--title" />
              <div className="kds-skeleton kds-skeleton--line" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="kds-tab-empty">
          <Utensils size={40} />
          <strong>No menu items found</strong>
          <span>{q ? `No match for "${searchQuery}"` : 'No active menu items.'}</span>
        </div>
      ) : (
        <div className="kds-menu-grid">
          {filtered.map((product) => (
            <div key={product.id} className="kds-menu-card">
              <div className="kds-menu-card__img">
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} />
                  : <Coffee size={28} style={{ color: '#b8a090' }} />
                }
              </div>
              <div className="kds-menu-card__body">
                <strong className="kds-menu-card__name">{product.name}</strong>
                <span className="kds-menu-card__cat">{product.category}</span>
                <span className="kds-menu-card__price">{formatCurrency(product.price)}</span>
                <span className={`kds-menu-card__stock ${product.is_active ? 'kds-menu-card__stock--in' : 'kds-menu-card__stock--out'}`}>
                  {product.is_active ? '● In Stock' : '○ Unavailable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Settings Tab ─── */
function SettingsTab({ refreshInterval, onIntervalChange, notifications, onNotificationsChange, sound, onSoundChange }) {
  const intervals = [
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
    { label: '15 seconds', value: 15000 },
    { label: '30 seconds', value: 30000 },
    { label: '1 minute', value: 60000 },
  ];

  return (
    <div>
      <div className="kds-tab-heading">
        <div>
          <h2>Kitchen Settings</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Configure your kitchen display preferences</p>
        </div>
      </div>

      <div className="kds-settings-grid">
        {/* Refresh Interval */}
        <div className="kds-settings-card">
          <div className="kds-settings-card__header">
            <RefreshCw size={20} />
            <div>
              <strong>Auto Refresh Interval</strong>
              <small>How often to fetch new orders automatically</small>
            </div>
          </div>
          <div className="kds-interval-options">
            {intervals.map((opt) => (
              <button
                key={opt.value}
                className={`kds-interval-btn ${refreshInterval === opt.value ? 'kds-interval-btn--active' : ''}`}
                onClick={() => onIntervalChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="kds-settings-card">
          <div className="kds-settings-card__header">
            {notifications ? <Bell size={20} /> : <BellOff size={20} />}
            <div>
              <strong>New Order Alerts</strong>
              <small>Show a notification badge when new orders arrive</small>
            </div>
            <button
              className={`kds-toggle ${notifications ? 'kds-toggle--on' : ''}`}
              onClick={() => onNotificationsChange(!notifications)}
              aria-label={notifications ? 'Disable notifications' : 'Enable notifications'}
            >
              <span className="kds-toggle__thumb" />
            </button>
          </div>
        </div>

        {/* Sound */}
        <div className="kds-settings-card">
          <div className="kds-settings-card__header">
            {sound ? <Zap size={20} /> : <Package size={20} />}
            <div>
              <strong>Sound Alerts</strong>
              <small>Play a sound when new orders arrive (browser support required)</small>
            </div>
            <button
              className={`kds-toggle ${sound ? 'kds-toggle--on' : ''}`}
              onClick={() => onSoundChange(!sound)}
              aria-label={sound ? 'Disable sound' : 'Enable sound'}
            >
              <span className="kds-toggle__thumb" />
            </button>
          </div>
        </div>

        {/* Theme placeholder */}
        <div className="kds-settings-card kds-settings-card--muted">
          <div className="kds-settings-card__header">
            <ChefHat size={20} />
            <div>
              <strong>Dark Mode Theme</strong>
              <small>Coming soon — switch to a dark kitchen display</small>
            </div>
            <span className="kds-soon-badge">Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [activePage, setActivePage] = useState('display');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(8000);
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(false);
  const prevOrderCount = useRef(0);
  const { toasts, addToast } = useToast();

  const loadOrders = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetchKitchenOrders();
      const data = res.data?.data || [];
      // Detect new orders for notification
      if (prevOrderCount.current !== 0 && data.length > prevOrderCount.current && notifications) {
        const newCount = data.length - prevOrderCount.current;
        addToast(`🍽️ ${newCount} new order${newCount > 1 ? 's' : ''} arrived!`, 'new-order');
      }
      prevOrderCount.current = data.length;
      setOrders(data);
      setError('');
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
      if (err.response?.status !== 401) {
        setError('Failed to load orders.');
        if (showLoader) addToast('Failed to load orders. Check connection.', 'error');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [notifications, addToast]);

  // Initial load + interval
  useEffect(() => {
    loadOrders(true);
    const interval = setInterval(() => loadOrders(false), refreshInterval);
    return () => clearInterval(interval);
  }, [loadOrders, refreshInterval]);

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(orderId);
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              kitchen_status: newStatus,
              kitchen_started_at: newStatus === 'preparing' ? new Date().toISOString() : o.kitchen_started_at,
              kitchen_completed_at: newStatus === 'completed' ? new Date().toISOString() : o.kitchen_completed_at,
            }
          : o
      )
    );
    try {
      await updateKitchenOrderStatus(orderId, newStatus);
      addToast(
        newStatus === 'preparing' ? '👨‍🍳 Order started!' : '✅ Order completed!',
        newStatus === 'completed' ? 'success' : 'info'
      );
      await loadOrders(false);
    } catch (err) {
      // Roll back optimistic update on failure
      await loadOrders(false);
      addToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualRefresh = () => {
    loadOrders(true);
    addToast('Orders refreshed.', 'info');
  };

  const toCookCount = orders.filter((o) => o.kitchen_status === 'to_cook').length;
  const preparingCount = orders.filter((o) => o.kitchen_status === 'preparing').length;
  const completedCount = orders.filter((o) => o.kitchen_status === 'completed').length;

  const formatTime = (d) => {
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');
  const { user: authUser, refreshUser } = useAuth();

  const handleOpenProfile = () => {
    setProfileModalTab('profile');
    setIsProfileModalOpen(true);
  };

  const handleOpenPassword = () => {
    setProfileModalTab('password');
    setIsProfileModalOpen(true);
  };

  return (
    <MainLayout
      activePage={activePage}
      onNavChange={setActivePage}
      onRefresh={handleManualRefresh}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      onOpenProfile={handleOpenProfile}
      onOpenPassword={handleOpenPassword}
    >
      {/* Inline styles for all KDS-specific classes */}
      <style>{`
        /* ── Board & Columns ── */
        .kds-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .kds-column { background: rgba(253,251,247,0.95); border: 1px solid var(--border); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 12px; min-height: 68vh; max-height: 76vh; overflow-y: auto; }
        .kds-column--tocook   { border-top: 3px solid #c77a5f; }
        .kds-column--preparing { border-top: 3px solid #a87857; }
        .kds-column--completed { border-top: 3px solid #547662; }
        .kds-column__header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #eee7df; }
        .kds-column__title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.92rem; color: #49352a; margin: 0; }
        .kds-column--tocook .kds-column__title svg { color: #c77a5f; }
        .kds-column--preparing .kds-column__title svg { color: #a87857; }
        .kds-column--completed .kds-column__title svg { color: #547662; }
        .kds-column__badge { background: #eee7df; color: #7d756f; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; }

        /* ── Order Cards ── */
        .kds-card { background: white; border: 1px solid #eee7df; border-radius: 16px; padding: 14px; box-shadow: 0 2px 10px rgba(64,47,36,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; gap: 10px; animation: fadeUp 0.3s ease both; }
        .kds-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(64,47,36,0.07); }
        .kds-card--to_cook { border-left: 3px solid #e8a989; }
        .kds-card--preparing { border-left: 3px solid #c4a06b; }
        .kds-card--completed { border-left: 3px solid #7aaa8e; opacity: 0.88; }
        .kds-card__header { display: flex; flex-direction: column; gap: 6px; }
        .kds-card__id-row { display: flex; align-items: center; justify-content: space-between; }
        .kds-card__id { font-weight: 800; font-size: 0.9rem; color: #49352a; }
        .kds-card__table { background: #f3ebe3; color: #8b6045; padding: 3px 8px; border-radius: 7px; font-size: 0.68rem; font-weight: 800; }
        .kds-card__meta-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .kds-card__customer { font-size: 0.78rem; color: #7d756f; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .kds-card__time { font-size: 0.7rem; color: #9d958e; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
        .kds-card__items { border-top: 1px dashed #eee7df; border-bottom: 1px dashed #eee7df; padding: 8px 0; display: flex; flex-direction: column; gap: 5px; }
        .kds-card__item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
        .kds-card__item-qty { background: #f7f5f0; border: 1px solid #e7e1d8; border-radius: 5px; min-width: 24px; height: 22px; display: grid; place-items: center; font-weight: 800; font-size: 0.72rem; color: #49352a; flex-shrink: 0; }
        .kds-card__item-name { flex: 1; color: #302b27; font-weight: 500; }
        .kds-card__item-price { font-size: 0.7rem; color: #9d958e; white-space: nowrap; }
        .kds-card__total { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: #49352a; }
        .kds-card__total strong { font-weight: 900; }
        .kds-card__btn { width: 100%; min-height: 42px; border: 0; border-radius: 11px; font-weight: 800; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: transform 0.2s ease, filter 0.2s ease; }
        .kds-card__btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(0.93); }
        .kds-card__btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .kds-card__btn--to_cook { background: #49352a; color: white; }
        .kds-card__btn--preparing { background: var(--sage); color: white; }
        .kds-card__ready-badge { display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; background: #e3eee7; color: #547662; border-radius: 10px; font-size: 0.78rem; font-weight: 800; }

        /* ── Empty States ── */
        .kds-empty { flex: 1; border: 2px dashed #ded8cf; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 18px; text-align: center; color: #9d958e; gap: 6px; }
        .kds-empty strong { display: block; color: #49352a; font-size: 0.86rem; }
        .kds-empty span { font-size: 0.72rem; }

        /* ── Stats bar ── */
        .kds-stats-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .kds-stat-chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 10px; font-size: 0.76rem; font-weight: 700; }
        .kds-stat-chip--tocook { background: #fff0ea; color: #b05a30; }
        .kds-stat-chip--preparing { background: #fdf4e7; color: #9b6b2f; }
        .kds-stat-chip--completed { background: #e8f4ec; color: #3e7a55; }
        .kds-stat-chip--refresh { background: #f2eee9; color: #7a6e65; margin-left: auto; cursor: pointer; border: 0; }
        .kds-stat-chip--refresh:hover { background: #e8e0d6; }
        .kds-last-refresh { font-size: 0.7rem; color: #9d958e; }
        .kds-error-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff1ee; border: 1px solid #e9c1bc; border-radius: 11px; padding: 10px 14px; margin-bottom: 16px; color: #96473e; font-size: 0.82rem; }
        .kds-error-bar button { border: 0; background: transparent; color: inherit; cursor: pointer; display: flex; gap: 5px; align-items: center; font-size: 0.8rem; font-weight: 700; }

        /* ── Completed list ── */
        .kds-completed-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; background: white; }
        .kds-completed-row { display: flex; align-items: center; gap: 16px; padding: 14px 18px; border-bottom: 1px solid #f0ebe4; }
        .kds-completed-row:last-child { border-bottom: 0; }
        .kds-completed-row:hover { background: #fdfaf7; }
        .kds-completed-row__left { display: flex; align-items: center; gap: 8px; min-width: 200px; }
        .kds-completed-row__center { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .kds-completed-row__right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .kds-completed-row__customer { font-size: 0.72rem; color: #9d958e; }
        .kds-ready-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 800; color: #547662; background: #e3eee7; padding: 3px 8px; border-radius: 7px; }

        .kds-cat-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; margin-top: 8px; }
        .kds-cat-chip { border: 1px solid #e7e1d8; background: white; border-radius: 10px; padding: 5px 13px; font-size: 0.76rem; font-weight: 700; color: #7a6e65; cursor: pointer; transition: all 0.18s ease; }
        .kds-cat-chip:hover { background: #f6f0ea; border-color: #cdb8a8; }
        .kds-cat-chip--active { background: #49352a; color: white; border-color: #49352a; }

        /* ── Settings ── */
        .kds-settings-grid { display: grid; gap: 14px; }
        .kds-settings-card { border: 1px solid var(--border); border-radius: 16px; padding: 18px 20px; background: white; }
        .kds-settings-card--muted { opacity: 0.65; }
        .kds-settings-card__header { display: flex; align-items: center; gap: 14px; }
        .kds-settings-card__header svg { color: #8b7060; flex-shrink: 0; }
        .kds-settings-card__header > div { flex: 1; }
        .kds-settings-card__header strong { display: block; font-size: 0.9rem; color: #302b27; }
        .kds-settings-card__header small { display: block; margin-top: 3px; font-size: 0.76rem; color: var(--muted); }
        .kds-interval-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .kds-interval-btn { border: 1px solid #e7e1d8; background: white; border-radius: 10px; padding: 6px 14px; font-size: 0.78rem; font-weight: 700; color: #7a6e65; cursor: pointer; transition: all 0.18s ease; }
        .kds-interval-btn:hover { background: #f6f0ea; }
        .kds-interval-btn--active { background: #49352a; color: white; border-color: #49352a; }
        .kds-toggle { width: 44px; height: 24px; border-radius: 999px; background: #ddd6ce; border: 0; cursor: pointer; padding: 2px; display: flex; align-items: center; transition: background 0.2s ease; flex-shrink: 0; }
        .kds-toggle--on { background: #547662; justify-content: flex-end; }
        .kds-toggle__thumb { width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: transform 0.2s ease; }
        .kds-soon-badge { background: #f4ede5; color: #9b7050; font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; }

        /* ── Tab heading ── */
        .kds-tab-heading { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .kds-tab-heading h2 { margin: 0 0 4px; font-size: 1.3rem; }
        .kds-tab-count { background: #f3ebe3; color: #8b6045; font-size: 1rem; font-weight: 900; padding: 4px 14px; border-radius: 12px; }
        .kds-tab-empty { min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #9d958e; text-align: center; border: 2px dashed #ddd6cc; border-radius: 18px; }
        .kds-tab-empty strong { color: #49352a; font-size: 1rem; }
        .kds-tab-empty span { font-size: 0.82rem; }

        /* ── Skeleton ── */
        .kds-skeleton-card { background: white; border: 1px solid #eee7df; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .kds-skeleton-card--menu .kds-skeleton--img { height: 100px; border-radius: 8px 8px 0 0; margin: -14px -14px 0; }
        .kds-skeleton { background: linear-gradient(90deg, #f0ece6 25%, #e8e2da 50%, #f0ece6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 7px; }
        .kds-skeleton--title { height: 16px; width: 70%; }
        .kds-skeleton--line { height: 12px; width: 90%; }
        .kds-skeleton--short { width: 50%; }
        .kds-skeleton--items { height: 60px; }
        .kds-skeleton--btn { height: 40px; }
        .kds-skeleton--img { height: 100px; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ── Toast ── */
        .kds-toasts { position: fixed; top: 90px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
        .kds-toast { padding: 10px 18px; border-radius: 12px; font-size: 0.84rem; font-weight: 700; box-shadow: 0 8px 24px rgba(64,47,36,0.15); animation: kdsToastIn 0.3s cubic-bezier(0.16,1,0.3,1) both; pointer-events: all; }
        .kds-toast--info { background: white; color: #302b27; border: 1px solid var(--border); }
        .kds-toast--success { background: #e3eee7; color: #2d6e45; }
        .kds-toast--error { background: #fff1ee; color: #96473e; }
        .kds-toast--new-order { background: #49352a; color: white; }
        @keyframes kdsToastIn { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }

        /* ── Spinner ── */
        .kds-spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; animation: spin 0.7s linear infinite; }

        /* ── Responsive ── */
        @media (max-width: 1024px) { .kds-board { grid-template-columns: repeat(2, 1fr); } .kds-column--completed { grid-column: 1 / -1; min-height: auto; } }
        @media (max-width: 768px) { .kds-board { grid-template-columns: 1fr; } .kds-column--completed { grid-column: auto; } .kds-column { min-height: auto; max-height: 60vh; } }
      `}</style>

      {/* Toast notifications */}
      <div className="kds-toasts">
        {toasts.map((toast) => (
          <div key={toast.id} className={`kds-toast kds-toast--${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div className="kds-stats-bar">
        <span className="kds-stat-chip kds-stat-chip--tocook">
          <UtensilsCrossed size={14} /> To Cook: <strong>{toCookCount}</strong>
        </span>
        <span className="kds-stat-chip kds-stat-chip--preparing">
          <Clock size={14} /> Preparing: <strong>{preparingCount}</strong>
        </span>
        <span className="kds-stat-chip kds-stat-chip--completed">
          <CheckCircle size={14} /> Completed: <strong>{completedCount}</strong>
        </span>
        {lastRefreshed && (
          <span className="kds-last-refresh">
            Last updated: {formatTime(lastRefreshed)}
          </span>
        )}
        <button className="kds-stat-chip kds-stat-chip--refresh" onClick={handleManualRefresh}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Error bar */}
      {error && (
        <div className="kds-error-bar">
          <span><AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{error}</span>
          <button onClick={() => loadOrders(true)}><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {/* Page content */}
      {activePage === 'display' && (
        <DisplaySystemTab
          orders={orders}
          actionLoading={actionLoading}
          onAction={handleStatusChange}
          searchQuery={searchQuery}
          loading={loading}
        />
      )}
      {activePage === 'completed' && (
        <CompletedTab orders={orders} searchQuery={searchQuery} />
      )}
      {activePage === 'menu' && (
        <MenuItemsTab searchQuery={searchQuery} />
      )}
      {activePage === 'settings' && (
        <SettingsTab
          refreshInterval={refreshInterval}
          onIntervalChange={setRefreshInterval}
          notifications={notifications}
          onNotificationsChange={setNotifications}
          sound={sound}
          onSoundChange={setSound}
        />
      )}
      {isProfileModalOpen && (
        <ProfileManagementModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={authUser}
          onUpdateUser={refreshUser}
          apiService={authService}
          roleLabel="Kitchen"
        />
      )}
    </MainLayout>
  );
}
