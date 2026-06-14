import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, Calendar, ChevronDown, Download, FileSpreadsheet, 
  FileText, TrendingUp, TrendingDown, Users, DollarSign, 
  Clock, Coffee, ShoppingBag, Eye, RefreshCw, Filter, Search,
  Award, Table
} from 'lucide-react';
import { 
  fetchReportsSummary, 
  fetchReportsRevenue, 
  fetchReportsProducts, 
  fetchReportsCustomers, 
  fetchReportsPayments,
  exportReportsCsv,
  exportReportsPdf
} from '../../services/reportsService';
import { fetchAdminTables, fetchEmployeeRequests, fetchAdminDashboard } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last_30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [tableId, setTableId] = useState('');
  const [productId, setProductId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Dropdown list options
  const [cashiersList, setCashiersList] = useState([]);
  const [tablesList, setTablesList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // Analytics report data
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tooltip/Hover states for charts
  const [activeRevenueHover, setActiveRevenueHover] = useState(null);
  const [activeOrdersHover, setActiveOrdersHover] = useState(null);

  // Load select option lists
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [dashRes, tablesRes, requestsRes] = await Promise.all([
          fetchAdminDashboard(),
          fetchAdminTables(),
          fetchEmployeeRequests()
        ]);
        
        setProductsList(dashRes.products || dashRes.data?.products || []);
        setTablesList(tablesRes.data?.data || tablesRes.data || []);
        
        // Filter approved cashiers
        const requests = requestsRes.data?.data || requestsRes.data || [];
        const approvedCashiers = requests.filter(r => r.role === 'cashier' && r.approval_status === 'approved');
        setCashiersList(approvedCashiers);
      } catch (err) {
        console.error('Failed to load filters data:', err);
      }
    };
    loadFiltersData();
  }, []);

  const filters = useMemo(() => {
    const params = { date_range: dateRange };
    if (dateRange === 'custom') {
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate).toISOString();
    }
    if (cashierId) params.cashier_id = cashierId;
    if (tableId) params.table_id = tableId;
    if (productId) params.product_id = productId;
    if (paymentMethod) params.payment_method = paymentMethod;
    return params;
  }, [dateRange, startDate, endDate, cashierId, tableId, productId, paymentMethod]);

  const loadReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, revRes, prodRes, custRes, payRes] = await Promise.all([
        fetchReportsSummary(filters),
        fetchReportsRevenue(filters),
        fetchReportsProducts(filters),
        fetchReportsCustomers(filters),
        fetchReportsPayments(filters)
      ]);

      setSummary(sumRes.summary || null);
      setRevenueData(revRes.data || []);
      setProductData(prodRes.data || []);
      setCustomerData(custRes.data || []);
      setPaymentData(payRes.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to compile analytics reports. Make sure orders database is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await exportReportsCsv(filters);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const fileDate = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `velluto-report-${fileDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('CSV Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await exportReportsPdf(filters);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const fileDate = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `velluto-report-${fileDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Helper for trend labels/pills
  const renderTrend = (trendObj) => {
    if (!trendObj) return null;
    const { trend, growth } = trendObj;
    if (trend === 'up') {
      return (
        <span className="reports-card-trend reports-card-trend--up">
          <TrendingUp size={12} /> {growth}
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span className="reports-card-trend reports-card-trend--down">
          <TrendingDown size={12} /> {growth}
        </span>
      );
    }
    return (
      <span className="reports-card-trend reports-card-trend--neutral">
        0%
      </span>
    );
  };

  // Render Card Sparklines dynamically matching trend data
  const renderSparkline = (dataPoints, key, color, type = 'line') => {
    if (!dataPoints || dataPoints.length === 0) {
      return (
        <svg className="reports-card-sparkline" viewBox="0 0 100 30">
          <path d="M 0,15 Q 25,10 50,20 T 100,15" fill="none" stroke="#ddd" strokeWidth="1.5" strokeDasharray="3,3" />
        </svg>
      );
    }
    const values = dataPoints.map(d => Number(d[key] || 0));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const height = 30;
    const width = 160;

    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1 || 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return { x, y };
    });

    const pathD = points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
    const areaD = pathD + ` L ${points[points.length - 1]?.x || 0} ${height} L ${points[0]?.x || 0} ${height} Z`;

    return (
      <svg className="reports-card-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '32px' }}>
        <defs>
          <linearGradient id={`spark-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#spark-grad-${key})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // Custom High-Fidelity SVG Line Chart for Revenue Trend
  const renderLineChart = () => {
    if (revenueData.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#8a7b70' }}>No revenue history available.</div>;
    }
    const maxVal = Math.max(...revenueData.map(d => d.revenue), 10);
    const height = 180;
    const width = 600;
    const points = revenueData.map((d, index) => {
      const x = (index / (revenueData.length - 1 || 1)) * (width - 60) + 30;
      const y = height - (d.revenue / maxVal) * (height - 50) - 25;
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
    const areaD = pathD + ` L ${points[points.length - 1]?.x || 0} ${height - 20} L ${points[0]?.x || 0} ${height - 20} Z`;

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {activeRevenueHover && (
          <div className="chart-tooltip-indicator">
            {activeRevenueHover.date}: <strong>₹{activeRevenueHover.revenue.toLocaleString()}</strong>
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '220px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#53725f" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#53725f" stopOpacity="0.01"/>
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          <line x1="30" y1={height - 20} x2={width - 30} y2={height - 20} stroke="#eee7df" strokeWidth="1.5" />
          <line x1="30" y1={(height - 20) / 2 + 10} x2={width - 30} y2={(height - 20) / 2 + 10} stroke="#f5efe8" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="30" y1="20" x2={width - 30} y2="20" stroke="#f5efe8" strokeWidth="1" strokeDasharray="4,4" />

          {/* Area Path */}
          {points.length > 0 && <path d={areaD} fill="url(#area-grad)" style={{ transition: 'all 0.3s ease' }} />}
          
          {/* Stroke Path */}
          {points.length > 0 && <path d={pathD} fill="none" stroke="#53725f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          
          {/* Interactive Marker circles */}
          {points.map((p, idx) => (
            <g key={idx}>
              {activeRevenueHover?.date === p.date && (
                <line x1={p.x} y1="20" x2={p.x} y2={height - 20} stroke="#d5c8bb" strokeWidth="1" strokeDasharray="3,3" />
              )}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={activeRevenueHover?.date === p.date ? "7" : "4.5"} 
                fill={activeRevenueHover?.date === p.date ? "#53725f" : "#fff"} 
                stroke="#53725f" 
                strokeWidth={activeRevenueHover?.date === p.date ? "2" : "2.5"} 
                style={{ cursor: 'pointer', transition: 'r 0.15s ease, fill 0.15s ease' }}
                onMouseEnter={() => setActiveRevenueHover(p)}
                onMouseLeave={() => setActiveRevenueHover(null)}
              />
            </g>
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9c958f', padding: '0 10px', marginTop: '6px', fontWeight: '800' }}>
          <span>{revenueData[0]?.date}</span>
          <span>{revenueData[Math.floor(revenueData.length / 2)]?.date}</span>
          <span>{revenueData[revenueData.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  // Custom High-Fidelity SVG Bar Chart for Orders Trend
  const renderBarChart = () => {
    if (revenueData.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#8a7b70' }}>No orders history available.</div>;
    }
    const maxOrders = Math.max(...revenueData.map(d => d.orders), 5);
    const height = 180;
    const width = 600;
    const paddingLeft = 30;
    const chartWidth = width - 60;
    const barWidth = Math.max(8, (chartWidth / revenueData.length) * 0.65);
    const gap = (chartWidth / revenueData.length) * 0.35;

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {activeOrdersHover && (
          <div className="chart-tooltip-indicator" style={{ background: '#4a382e' }}>
            {activeOrdersHover.date}: <strong>{activeOrdersHover.orders} orders</strong>
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '220px', overflow: 'visible' }}>
          <line x1="30" y1={height - 20} x2={width - 30} y2={height - 20} stroke="#eee7df" strokeWidth="1.5" />
          <line x1="30" y1={(height - 20) / 2 + 10} x2={width - 30} y2={(height - 20) / 2 + 10} stroke="#f5efe8" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="30" y1="20" x2={width - 30} y2="20" stroke="#f5efe8" strokeWidth="1" strokeDasharray="4,4" />

          {revenueData.map((d, index) => {
            const barHeight = (d.orders / maxOrders) * (height - 50);
            const x = paddingLeft + index * (barWidth + gap) + gap / 2;
            const y = height - barHeight - 20;
            const isHovered = activeOrdersHover?.date === d.date;

            return (
              <g key={index}>
                <rect 
                  x={x} 
                  y={y} 
                  width={barWidth} 
                  height={Math.max(barHeight, 3)} 
                  fill={isHovered ? "#6e4a34" : "#8b6045"} 
                  rx={Math.min(4, barWidth / 2)}
                  style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
                  onMouseEnter={() => setActiveOrdersHover(d)}
                  onMouseLeave={() => setActiveOrdersHover(null)}
                />
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9c958f', padding: '0 10px', marginTop: '6px', fontWeight: '800' }}>
          <span>{revenueData[0]?.date}</span>
          <span>{revenueData[Math.floor(revenueData.length / 2)]?.date}</span>
          <span>{revenueData[revenueData.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  // Custom High-Fidelity SVG Doughnut Chart for Payments
  const renderPaymentsChart = () => {
    if (paymentData.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#8a7b70' }}>No payment distribution data.</div>;
    }
    const total = paymentData.reduce((acc, d) => acc + d.revenue, 0);
    const colorsList = ['#53725f', '#8b6045', '#c77a5f', '#cfaa5f', '#7d756f'];
    
    let cumulativePercent = 0;
    const circumference = 2 * Math.PI * 35; // 219.91
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', gap: '40px', padding: '16px 20px', flexWrap: 'wrap', width: '100%' }}>
        <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0, margin: '0 auto' }}>
          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '140px', height: '140px' }}>
            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f6f3ec" strokeWidth="12" />
            {paymentData.map((d, i) => {
              const percent = d.revenue / (total || 1);
              const strokeLength = percent * circumference;
              const strokeOffset = cumulativePercent * circumference;
              cumulativePercent += percent;
              return (
                <circle 
                  key={i}
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="transparent" 
                  stroke={colorsList[i % colorsList.length]} 
                  strokeWidth="12" 
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={-strokeOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.64rem', color: '#8a7b70', fontWeight: '800', textTransform: 'uppercase' }}>Total Net</span>
            <strong style={{ fontSize: '1.05rem', color: '#3b2b22', fontWeight: '800', marginTop: '1px' }}>₹{Math.round(total).toLocaleString()}</strong>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '180px' }}>
          {paymentData.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px dashed #f5efe8', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: colorsList[i % colorsList.length] }} />
                <span style={{ textTransform: 'capitalize', color: '#3b2b22', fontWeight: '800' }}>{d.method}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: '#49352a', display: 'block' }}>₹{d.revenue.toLocaleString()}</strong>
                <span style={{ color: '#8a7b70', fontSize: '0.72rem' }}>{Math.round((d.revenue / (total || 1)) * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Filter products by search query
  const filteredProductData = useMemo(() => {
    return productData.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [productData, searchQuery]);

  return (
    <div className="reports-container">
      {/* Top Header */}
      <div className="reports-header">
        <div className="reports-title-section">
          <h1>Reports & Analytics</h1>
          <p>Real-time business insights and sales indicators</p>
        </div>
        <div className="reports-header-actions">
          <button onClick={loadReportData} className="reports-btn" title="Sync report calculations">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button onClick={handleExportCSV} disabled={exporting} className="reports-btn">
            <FileSpreadsheet size={15} />
            CSV Export
          </button>
          <button onClick={handleExportPDF} disabled={exporting} className="reports-btn reports-btn--danger">
            <FileText size={15} />
            {exporting ? 'Generating PDF...' : 'PDF Report'}
          </button>
        </div>
      </div>

      {/* Glassmorphic Filter Bar */}
      <div className="reports-filter-card">
        <div className="reports-filter-header">
          <h3>
            <Filter size={16} color="#53725f" />
            Query Filters
          </h3>
          <div className="reports-quick-ranges">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last_7', label: '7 Days' },
              { id: 'last_30', label: '30 Days' },
              { id: 'custom', label: 'Custom' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id)}
                className={`reports-quick-range-btn ${dateRange === r.id ? 'reports-quick-range-btn--active' : ''}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reports-filter-grid">
          {/* Cashier selection */}
          <div className="reports-field">
            <label>Cashier</label>
            <div className="reports-select-wrapper">
              <Users size={16} className="reports-select-icon" />
              <select 
                value={cashierId} 
                onChange={(e) => setCashierId(e.target.value)}
                className="reports-select"
              >
                <option value="">All Cashiers</option>
                {cashiersList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="reports-select-chevron" />
            </div>
          </div>

          {/* Table selection */}
          <div className="reports-field">
            <label>Table</label>
            <div className="reports-select-wrapper">
              <Table size={16} className="reports-select-icon" />
              <select 
                value={tableId} 
                onChange={(e) => setTableId(e.target.value)}
                className="reports-select"
              >
                <option value="">All Tables</option>
                {tablesList.map(t => (
                  <option key={t.id} value={t.id}>{t.table_name || t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="reports-select-chevron" />
            </div>
          </div>

          {/* Product selection */}
          <div className="reports-field">
            <label>Product</label>
            <div className="reports-select-wrapper">
              <Coffee size={16} className="reports-select-icon" />
              <select 
                value={productId} 
                onChange={(e) => setProductId(e.target.value)}
                className="reports-select"
              >
                <option value="">All Products</option>
                {productsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="reports-select-chevron" />
            </div>
          </div>

          {/* Payment Method */}
          <div className="reports-field">
            <label>Payment Mode</label>
            <div className="reports-select-wrapper">
              <DollarSign size={16} className="reports-select-icon" />
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="reports-select"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="razorpay">Razorpay</option>
              </select>
              <ChevronDown size={14} className="reports-select-chevron" />
            </div>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {dateRange === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '420px', borderTop: '1px dashed #eee7df', paddingTop: '16px' }}>
            <div className="reports-field">
              <label>Start Date</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Calendar size={15} style={{ position: 'absolute', left: '12px', color: '#9c8e84' }} />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 12px 0 36px', borderRadius: '12px', border: '1px solid #e7e1d8', outline: 0, fontWeight: '700' }}
                />
              </div>
            </div>
            <div className="reports-field">
              <label>End Date</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Calendar size={15} style={{ position: 'absolute', left: '12px', color: '#9c8e84' }} />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 12px 0 36px', borderRadius: '12px', border: '1px solid #e7e1d8', outline: 0, fontWeight: '700' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {loading ? (
        <div className="admin-loader">
          <LoadingSpinner label="Compiling business intelligence report..." />
        </div>
      ) : (
        <>
          {/* Summary Metrics Grid */}
          <div className="reports-cards-grid">
            
            {/* Total Revenue */}
            <div className="reports-card reports-card--revenue">
              <div className="reports-card-top">
                <span className="reports-card-icon"><DollarSign size={18} /></span>
                {summary && renderTrend(summary.totalRevenue)}
              </div>
              <small>Total Revenue</small>
              <strong>₹{(summary?.totalRevenue?.value || 0).toLocaleString('en-IN')}</strong>
              {renderSparkline(revenueData, 'revenue', '#53725f')}
              <div className="reports-card-footer">
                <span>Timeline aggregate sales</span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="reports-card reports-card--orders">
              <div className="reports-card-top">
                <span className="reports-card-icon"><ShoppingBag size={18} /></span>
                {summary && renderTrend(summary.totalOrders)}
              </div>
              <small>Total Orders</small>
              <strong>{summary?.totalOrders?.value || 0}</strong>
              {renderSparkline(revenueData, 'orders', '#8b6045')}
              <div className="reports-card-footer">
                <span>Receipt count compiled</span>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="reports-card reports-card--aov">
              <div className="reports-card-top">
                <span className="reports-card-icon"><TrendingUp size={18} /></span>
                {summary && renderTrend(summary.avgOrderValue)}
              </div>
              <small>Avg Order Value</small>
              <strong>₹{(summary?.avgOrderValue?.value || 0).toFixed(2)}</strong>
              {renderSparkline(revenueData, 'revenue', '#c77a5f')}
              <div className="reports-card-footer">
                <span>Ticket size average</span>
              </div>
            </div>

            {/* Repeat Customers */}
            <div className="reports-card reports-card--customers">
              <div className="reports-card-top">
                <span className="reports-card-icon"><Users size={18} /></span>
                {summary && renderTrend(summary.repeatCustomers)}
              </div>
              <small>Repeat Shoppers</small>
              <strong>{summary?.repeatCustomers?.value || 0}</strong>
              {renderSparkline(revenueData, 'orders', '#cfaa5f')}
              <div className="reports-card-footer">
                <span>Loyalty index frequency</span>
              </div>
            </div>

            {/* Top Product */}
            <div className="reports-card reports-card--product">
              <div className="reports-card-top">
                <span className="reports-card-icon"><Coffee size={18} /></span>
              </div>
              <small>Best Seller</small>
              <strong style={{ fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', marginTop: '6px' }}>
                {summary?.topSellingProduct?.value || 'N/A'}
              </strong>
              <div style={{ height: '32px' }} />
              <div className="reports-card-footer">
                <span>Highest quantities ordered</span>
              </div>
            </div>

            {/* Peak Hour */}
            <div className="reports-card reports-card--hour">
              <div className="reports-card-top">
                <span className="reports-card-icon"><Clock size={18} /></span>
              </div>
              <small>Peak Traffic</small>
              <strong>{summary?.peakSellingTime?.value || 'N/A'}</strong>
              <div style={{ height: '32px' }} />
              <div className="reports-card-footer">
                <span>Maximum orders hourly slot</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="reports-charts-container">
            {/* Revenue Trend */}
            <div className="reports-chart-card">
              <div className="reports-chart-header">
                <div>
                  <h2>Revenue Trend</h2>
                  <p>Sales timeline tracking (INR)</p>
                </div>
                <TrendingUp size={18} color="#53725f" />
              </div>
              {renderLineChart()}
            </div>

            {/* Orders Trend */}
            <div className="reports-chart-card">
              <div className="reports-chart-header">
                <div>
                  <h2>Orders Distribution</h2>
                  <p>Orders timeline volume</p>
                </div>
                <ShoppingBag size={18} color="#8b6045" />
              </div>
              {renderBarChart()}
            </div>

            {/* Payment Split */}
            <div className="reports-chart-card">
              <div className="reports-chart-header">
                <div>
                  <h2>Payment Method Split</h2>
                  <p>Revenue distribution by collection channel</p>
                </div>
                <DollarSign size={18} color="#cfaa5f" />
              </div>
              {renderPaymentsChart()}
            </div>
          </div>

          {/* Tables Section */}
          <div className="reports-tables-container">
            
            {/* Top Products Table */}
            <div className="reports-table-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#3b2b22', fontWeight: '800' }}>Top Selling Products</h2>
                  <p style={{ margin: '2px 0 0', color: '#8a7b70', fontSize: '0.74rem' }}>Highest quantities sold</p>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', color: '#9c8e84' }} />
                  <input 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ height: '34px', padding: '0 10px 0 30px', border: '1px solid #e7e1d8', borderRadius: '8px', fontSize: '0.78rem', outline: 0, width: '160px' }}
                  />
                </div>
              </div>
              <div className="reports-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center' }}>Sold</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'center' }}>Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProductData.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#9c8e84' }}>No products match query.</td>
                      </tr>
                    ) : (
                      filteredProductData.map((p, idx) => {
                        const productDetail = productsList.find(pr => pr.name === p.name);
                        const imageSrc = productDetail?.image_url;
                        return (
                          <tr key={idx}>
                            <td>
                              <div className="reports-prod-cell">
                                {imageSrc ? (
                                  <img src={imageSrc} alt={p.name} className="reports-prod-thumb" />
                                ) : (
                                  <div className="reports-prod-placeholder"><Coffee size={18} /></div>
                                )}
                                <div>
                                  <strong style={{ color: '#3b2b22', display: 'block' }}>{p.name}</strong>
                                  <span style={{ fontSize: '0.72rem', color: '#8a7b70' }}>{productDetail?.category_name || 'Cafe Item'}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '800' }}>{p.quantitySold}</td>
                            <td style={{ textAlign: 'right', fontWeight: '800', color: '#53725f' }}>₹{p.revenue.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span 
                                className={`badge stock-badge stock-badge--${p.trend === 'healthy' ? 'in' : p.trend === 'low' ? 'low' : 'out'}`}
                                style={{ fontSize: '0.66rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}
                              >
                                {p.trend === 'healthy' ? 'In Stock' : p.trend === 'low' ? 'Low Stock' : 'Out of Stock'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Customers Table */}
            <div className="reports-table-card">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#3b2b22', fontWeight: '800' }}>Top Spending Customers</h2>
                <p style={{ margin: '2px 0 0', color: '#8a7b70', fontSize: '0.74rem' }}>Loyal diners analytics</p>
              </div>
              <div className="reports-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th style={{ textAlign: 'center' }}>Orders</th>
                      <th style={{ textAlign: 'right' }}>Total Spent</th>
                      <th style={{ textAlign: 'right' }}>Last Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#9c8e84' }}>No customer history recorded.</td>
                      </tr>
                    ) : (
                      customerData.map((c, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="reports-cust-cell">
                              <div className="reports-cust-avatar">{c.name.charAt(0).toUpperCase()}</div>
                              <div className="reports-cust-details">
                                <span className="reports-cust-name">{c.name}</span>
                                <span className="reports-cust-email">{c.email}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '800' }}>
                            {c.orders}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: '#3b7d55' }}>
                            ₹{c.totalSpent.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#8a7b70', fontSize: '0.78rem' }}>
                            {new Date(c.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
