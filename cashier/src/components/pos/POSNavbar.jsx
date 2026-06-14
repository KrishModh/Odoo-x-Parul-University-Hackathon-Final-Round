import { Menu, Search, History } from 'lucide-react';
import BrandMark from '../BrandMark';
import ProfileMenu from '../ProfileMenu';
import { formatCurrency } from '../../utils/money';

export default function POSNavbar({ selectedTable, user, onLogout, stats, onOpenHistory, onOpenProfile, onOpenPassword }) {
  return (
    <header className="pos-navbar">
      <div className="pos-navbar__brand">
        {/* <button className="pos-menu-button"><Menu size={21} /></button> */}
        <BrandMark title="Velluto Cashier" subtitle="PREMIUM" /></div>
      <label className="pos-search"><Search size={18} /><input placeholder="Search products, tables, orders..." /></label>
      <div className="pos-navbar__meta">
        <span className="pos-table-indicator">{selectedTable ? selectedTable.name : 'No table selected'}</span>
        {stats && (
          <div className="pos-navbar-stats">
            <span className="stats-badge stats-badge--orders">
              <strong>{stats.todays_orders}</strong> today
            </span>
            <span className="stats-badge stats-badge--sales">
              <strong>{formatCurrency(stats.todays_revenue)}</strong>
            </span>
          </div>
        )}
        <button className="navbar-history-btn" onClick={onOpenHistory} title="View Ledger & Stats">
          <History size={18} />
          <span>History</span>
        </button>
        <ProfileMenu 
          user={user} 
          roleLabel="Cashier" 
          onLogout={onLogout} 
          onOpenProfile={onOpenProfile} 
          onOpenPassword={onOpenPassword} 
          triggerClassName="profile-button profile-button--pos" 
          compact 
        />
      </div>
    </header>
  );
}
