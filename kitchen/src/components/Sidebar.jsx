import { createElement } from 'react';
import {
  CheckCircle, ChevronLeft, LayoutDashboard,
  LogOut, Menu, Settings, UtensilsCrossed, X,
} from 'lucide-react';
import BrandMark from './BrandMark';

const navItems = [
  { id: 'display',   label: 'Display System', icon: LayoutDashboard },
  { id: 'completed', label: 'Completed',       icon: CheckCircle },
  { id: 'menu',      label: 'Menu Items',      icon: UtensilsCrossed },
  { id: 'settings',  label: 'Settings',        icon: Settings },
];

export default function Sidebar({ open, collapsed, onClose, onCollapse, onLogout, activePage, onNavChange }) {
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
            <button
              key={item.id}
              className={`sidebar__link ${activePage === item.id ? 'is-active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => { onNavChange?.(item.id); onClose(); }}
            >
              {createElement(item.icon, { size: 20 })}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            className="sidebar__link sidebar__logout"
            onClick={onLogout}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
          <button className="sidebar__collapse" onClick={onCollapse} aria-label="Toggle sidebar">
            {collapsed ? <Menu size={18} /> : <><ChevronLeft size={18} /><span>Collapse sidebar</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
