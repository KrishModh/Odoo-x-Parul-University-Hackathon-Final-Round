import { Bell, CalendarDays, ChevronDown, Menu, Search } from 'lucide-react';

export default function TopNavbar({ user = {}, onMenuClick }) {
  const initials = user.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CS';

  const date = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="topbar">
      {/* Menu Button */}
      <button
        className="icon-button topbar__menu"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Search Bar */}
      <div className="topbar__search">
        <Search size={18} />
        <input
          type="search"
          aria-label="Search"
          placeholder="Search orders, tables, menu..."
        />
      </div>

      {/* Actions */}
      <div className="topbar__actions">
        <span className="topbar__date">
          <CalendarDays size={17} />
          {date}
        </span>

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="notification-indicator" />
        </button>

        {/* Profile */}
        <button className="profile-button" aria-haspopup="true">
          <span className="avatar">{initials}</span>
          <span className="profile-button__copy">
            <strong>{user.name || 'Cafe Staff'}</strong>
            <small>{user.role || 'Cashier'}</small>
          </span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
