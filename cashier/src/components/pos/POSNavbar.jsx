import { Menu, Search, History } from 'lucide-react';
import BrandMark from '../BrandMark';
import ProfileMenu from '../ProfileMenu';
import { formatCurrency } from '../../utils/money';

export default function POSNavbar({ selectedTable, user, onLogout, stats, onOpenHistory, onOpenProfile, onOpenPassword, searchQuery, onSearchChange }) {
  return (
    <header className="pos-navbar">
      <div className="pos-navbar__brand">
        {/* <button className="pos-menu-button"><Menu size={21} /></button> */}
        <BrandMark title="Velluto Cashier" subtitle="PREMIUM cafe" /></div>
      <label className="pos-search">
        <Search size={18} />
        <input 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products, tables, orders..." 
        />
        <kbd className="pos-search-shortcut">⌘K</kbd>
      </label>
      <div className="pos-navbar__meta">
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
