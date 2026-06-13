import { createElement } from 'react';
import { BarChart3, ChevronLeft, Coffee, LayoutDashboard, LogOut, Menu, ReceiptText, Settings, UtensilsCrossed, X } from 'lucide-react';
import BrandMark from './BrandMark';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'New order', icon: Coffee },
  { label: 'Orders', icon: ReceiptText },
  { label: 'Menu', icon: UtensilsCrossed },
  { label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ open, collapsed, onClose, onCollapse, onLogout }) {
  return (
    <>
      {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Close menu" />}
      <aside className={`sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar__header">
          <BrandMark compact={collapsed} />
          <button className="icon-button sidebar__mobile-close" onClick={onClose}><X size={20} /></button>
        </div>
        <nav className="sidebar__nav" aria-label="Main navigation">
          <span className="sidebar__section-label">WORKSPACE</span>
          {navItems.map((item) => (
            <button key={item.label} className={`sidebar__link ${item.active ? 'is-active' : ''}`} title={collapsed ? item.label : undefined}>
              {createElement(item.icon, { size: 20 })} <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button className="sidebar__link"><Settings size={20} /><span>Settings</span></button>
          <button className="sidebar__link sidebar__logout" onClick={onLogout}><LogOut size={20} /><span>Sign out</span></button>
          <button className="sidebar__collapse" onClick={onCollapse} aria-label="Toggle sidebar">
            {collapsed ? <Menu size={18} /> : <><ChevronLeft size={18} /><span>Collapse sidebar</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
