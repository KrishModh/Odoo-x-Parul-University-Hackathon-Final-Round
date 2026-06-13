import { Bell, CalendarDays, ChevronDown, Menu, Search } from 'lucide-react';

export default function TopNavbar({ user, onMenuClick }) {
  const initials = user?.name?.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() || 'CS';
  const date = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <header className="topbar">
      <button className="icon-button topbar__menu" onClick={onMenuClick}><Menu size={22} /></button>
      <div className="topbar__search"><Search size={18} /><input aria-label="Search" placeholder="Search orders, tables, menu..." /></div>
      <div className="topbar__actions">
        <span className="topbar__date"><CalendarDays size={17} />{date}</span>
        <button className="icon-button notification-button"><Bell size={19} /><span /></button>
        <button className="profile-button">
          <span className="avatar">{initials}</span>
          <span className="profile-button__copy"><strong>{user?.name || 'Cafe Staff'}</strong><small>{user?.role || 'Cashier'}</small></span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
