import { createElement } from 'react';
import {
  BarChart3,
  ChevronLeft,
  Coffee,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  UtensilsCrossed,
  X,
} from 'lucide-react';
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
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}
      <aside
        className={`sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="sidebar__header">
          <BrandMark compact={collapsed} />
          <button
            className="icon-button sidebar__mobile-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          <span className="sidebar__section-label">WORKSPACE</span>
          {navItems.map(({ label, icon, active }) => (
            <button
              key={label}
              className={`sidebar__link ${active ? 'is-active' : ''}`}
              title={collapsed ? label : undefined}
              aria-current={active ? 'page' : undefined}
            >
              {createElement(icon, { size: 20 })}
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <button className="sidebar__link">
            <Settings size={20} />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            className="sidebar__link sidebar__logout"
            onClick={onLogout}
            aria-label="Sign out"
          >
            <LogOut size={20} />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            className="sidebar__collapse"
            onClick={onCollapse}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <Menu size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
