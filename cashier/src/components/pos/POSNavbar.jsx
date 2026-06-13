import { Menu, Search } from 'lucide-react';
import BrandMark from '../BrandMark';
import ProfileMenu from '../ProfileMenu';

export default function POSNavbar({ selectedTable, user, onLogout }) {
  return (
    <header className="pos-navbar">
      <div className="pos-navbar__brand"><button className="pos-menu-button"><Menu size={21} /></button><BrandMark title="Velluto Cashier" subtitle="PREMIUM POS" /></div>
      <label className="pos-search"><Search size={18} /><input placeholder="Search products, tables, orders..." /></label>
      <div className="pos-navbar__meta">
        <span className="pos-table-indicator">{selectedTable ? selectedTable.name : 'No table selected'}</span>
        <ProfileMenu user={user} roleLabel="Cashier" onLogout={onLogout} triggerClassName="profile-button profile-button--pos" compact />
      </div>
    </header>
  );
}
