import { Menu, Search, UserRound } from 'lucide-react';
import BrandMark from '../BrandMark';

export default function POSNavbar({ selectedTable, user }) {
  return (
    <header className="pos-navbar">
      <div className="pos-navbar__brand"><button className="pos-menu-button"><Menu size={21} /></button><BrandMark /></div>
      <label className="pos-search"><Search size={18} /><input placeholder="Search products, tables, orders..." /></label>
      <div className="pos-navbar__meta">
        <span className="pos-table-indicator">{selectedTable ? selectedTable.name : 'No table selected'}</span>
        <button className="pos-employee"><span><UserRound size={18} /></span><strong>{user?.name || 'Cashier'}</strong></button>
      </div>
    </header>
  );
}
