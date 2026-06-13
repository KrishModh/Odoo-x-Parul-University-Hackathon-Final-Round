import { useEffect, useState } from 'react';
import { ArrowRight, CircleDollarSign, Coffee, Plus, ReceiptText, RefreshCw, UsersRound, UtensilsCrossed } from 'lucide-react';
import CashierLayout from '../../layouts/CashierLayout';
import MetricCard from '../../components/MetricCard';
import TableCard from '../../components/TableCard';
import OrderList from '../../components/OrderList';
import CategoryCard from '../../components/CategoryCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchDashboard } from '../../services/dashboardService';
import '../../css/cashier/dashboard.css';

const fallbackData = {
  summary: [
    { label: 'Today’s sales', value: '₹18,420', detail: '+12.5% from yesterday', icon: CircleDollarSign, tone: 'coffee' },
    { label: 'Total orders', value: '86', detail: '14 currently active', icon: ReceiptText, tone: 'sage' },
    { label: 'Guests served', value: '134', detail: 'Average 1.6 per order', icon: UsersRound, tone: 'peach' },
    { label: 'Avg. order value', value: '₹214', detail: '+₹18 this week', icon: Coffee, tone: 'blue' },
  ],
  tables: [
    { name: 'Table 01', status: 'occupied', seats: 4, order: 'Order #1042', total: '₹860' },
    { name: 'Table 02', status: 'available', seats: 2 },
    { name: 'Table 03', status: 'reserved', seats: 4, order: 'Reserved · 1:30 PM' },
    { name: 'Table 04', status: 'occupied', seats: 6, order: 'Order #1046', total: '₹1,240' },
    { name: 'Table 05', status: 'available', seats: 2 },
    { name: 'Patio 01', status: 'occupied', seats: 4, order: 'Order #1048', total: '₹540' },
  ],
  orders: [
    { id: '#1048', customer: 'Patio 01', items: 3, time: '2 min ago', status: 'preparing', total: '₹540' },
    { id: '#1047', customer: 'Takeaway', items: 2, time: '6 min ago', status: 'ready', total: '₹380' },
    { id: '#1046', customer: 'Table 04', items: 7, time: '12 min ago', status: 'preparing', total: '₹1,240' },
    { id: '#1045', customer: 'Maya', items: 2, time: '18 min ago', status: 'served', total: '₹320' },
  ],
  categories: [
    { name: 'Coffee', count: 18, emoji: '☕', color: '#e6d3c1' }, { name: 'Cold drinks', count: 12, emoji: '🥤', color: '#cfe3df' },
    { name: 'Breakfast', count: 9, emoji: '🥐', color: '#f3ddad' }, { name: 'Desserts', count: 14, emoji: '🍰', color: '#ead0d0' },
  ],
};

export default function DashboardPage() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetchDashboard();
      setData({ ...fallbackData, ...response.data });
    } catch (requestError) {
      if (requestError.response?.status !== 401) setError('Live dashboard data is unavailable. Showing today’s preview.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);

  return (
    <CashierLayout>
      <div className="dashboard-heading"><div><span className="eyebrow">SATURDAY, JUNE 13</span><h1>Good morning, let’s brew a great day.</h1><p>Here’s what’s happening across your cafe right now.</p></div><button className="primary-button primary-button--small"><Plus size={18} />New order</button></div>
      {error && <div className="dashboard-notice">{error}<button onClick={loadDashboard}><RefreshCw size={15} />Retry</button></div>}
      {loading ? <div className="dashboard-loader"><LoadingSpinner label="Preparing your dashboard..." /></div> : <>
        <section className="metrics-grid">{data.summary.map((item) => <MetricCard key={item.label} {...item} icon={item.icon || Coffee} />)}</section>
        <section className="dashboard-grid">
          <div className="dashboard-column dashboard-column--wide">
            <div className="section-card"><div className="section-heading"><div><h2>Table overview</h2><p>Live floor status</p></div><div className="table-legend"><span><i className="available" />Available</span><span><i className="occupied" />Occupied</span><span><i className="reserved" />Reserved</span></div></div><div className="table-grid">{data.tables.map((table) => <TableCard key={table.name} table={table} />)}</div></div>
            <div className="section-card"><div className="section-heading"><div><h2>Recent orders</h2><p>Latest activity from the floor</p></div><button className="text-button">View all <ArrowRight size={16} /></button></div><OrderList orders={data.orders} /></div>
          </div>
          <aside className="dashboard-column">
            <div className="section-card quick-actions"><div className="section-heading"><div><h2>Quick actions</h2><p>Your everyday shortcuts</p></div></div><button className="quick-action quick-action--primary"><span><Plus size={22} /></span><div><strong>Create new order</strong><small>Dine-in or takeaway</small></div><ArrowRight size={18} /></button><button className="quick-action"><span><UtensilsCrossed size={21} /></span><div><strong>Manage tables</strong><small>Update floor availability</small></div><ArrowRight size={18} /></button><button className="quick-action"><span><ReceiptText size={21} /></span><div><strong>Open orders</strong><small>14 orders in progress</small></div><ArrowRight size={18} /></button></div>
            <div className="section-card"><div className="section-heading"><div><h2>Menu categories</h2><p>Jump to a collection</p></div></div><div className="category-grid">{data.categories.map((category) => <CategoryCard key={category.name} category={category} />)}</div></div>
          </aside>
        </section>
      </>}
    </CashierLayout>
  );
}
