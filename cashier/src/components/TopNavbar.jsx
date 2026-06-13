import { Bell, CalendarDays, Menu, Search } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

export default function TopNavbar({ user, onMenuClick, onLogout, portalTitle }) {
  const date = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar__identity">
        <button className="icon-button topbar__menu" onClick={onMenuClick}><Menu size={22} /></button>
        <div className="topbar__portal">
          <span className="eyebrow">PORTAL</span>
          <strong>{portalTitle}</strong>
        </div>
      </div>
      <div className="topbar__search"><Search size={18} /><input aria-label="Search" placeholder="Search orders, tables, menu..." /></div>
      <div className="topbar__actions">
        <span className="topbar__date"><CalendarDays size={17} />{date}</span>
        <button className="icon-button notification-button"><Bell size={19} /><span /></button>
        <ProfileMenu user={user} roleLabel="Cashier" onLogout={onLogout} />
      </div>
    </header>
  );
}
