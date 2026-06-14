import { useEffect, useRef, useState } from 'react';
import {
  Bell, CalendarDays, ChevronDown, LogOut, Menu,
  RefreshCw, Search, Settings, UserCircle, X,
} from 'lucide-react';
import { fetchNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

export default function TopNavbar({ user, onMenuClick, onLogout, onRefresh, onSearch, searchQuery = '', onOpenProfile, onOpenPassword }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'KS';
  const date = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  // Fetch notifications helper
  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      const notifs = res.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Poll notifications
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    if (dropdownOpen || notifDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, notifDropdownOpen]);

  // Close on ESC
  useEffect(() => {
    const onKeyDown = (e) => { 
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout?.();
  };

  const handleRefresh = () => {
    setDropdownOpen(false);
    onRefresh?.();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        loadNotifications();
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  return (
    <header className="topbar">
      <button className="icon-button topbar__menu" onClick={onMenuClick} aria-label="Open sidebar">
        <Menu size={22} />
      </button>

      {/* Search bar */}
      <div className="topbar__search">
        <Search size={18} />
        <input
          aria-label="Search orders, tables, menu..."
          placeholder="Search orders, tables, menu..."
          value={searchQuery}
          onChange={(e) => onSearch?.(e.target.value)}
        />
        {searchQuery && (
          <button
            style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#9d958e', display: 'grid', placeItems: 'center' }}
            onClick={() => onSearch?.('')}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="topbar__actions">
        <span className="topbar__date"><CalendarDays size={17} />{date}</span>

        {/* Notification bell and dropdown */}
        <div ref={notifDropdownRef} style={{ position: 'relative' }}>
          <button 
            className="icon-button notification-button" 
            aria-label="Notifications"
            onClick={() => setNotifDropdownOpen(v => !v)}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="kn-unread-dot" />
            )}
          </button>

          {notifDropdownOpen && (
            <div className="kn-profile-dropdown" style={{ width: '320px', padding: 0 }}>
              <div className="kn-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fbf9f6', padding: '12px 16px' }}>
                <strong style={{ color: '#49352a', fontSize: '0.9rem' }}>Notifications</strong>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    style={{ fontSize: '0.74rem', background: 'transparent', border: 0, color: '#8b6045', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="kn-dropdown-divider" />
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#99918a', fontSize: '0.8rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)} 
                      style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid #ede8e2', 
                        cursor: 'pointer', 
                        background: n.isRead ? 'transparent' : '#fffaf5',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <strong style={{ fontSize: '0.82rem', color: n.isRead ? '#7d756f' : '#49352a', fontWeight: n.isRead ? '600' : '800' }}>
                          {n.title}
                        </strong>
                        {!n.isRead && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#c77a5f', flexShrink: 0, marginTop: '4px' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#6e655f', lineHeight: '1.3' }}>
                        {n.message}
                      </span>
                      <small style={{ fontSize: '0.64rem', color: '#aaa19a', alignSelf: 'flex-end', marginTop: '2px' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="profile-button"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span className="avatar">{initials}</span>
            <span className="profile-button__copy">
              <strong>{user?.name || 'Kitchen Staff'}</strong>
              <small>{user?.role || 'kitchen'}</small>
            </span>
            <ChevronDown
              size={16}
              style={{ transition: 'transform 0.2s ease', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {dropdownOpen && (
            <div className="kn-profile-dropdown">
              {/* Header info */}
              <div className="kn-dropdown-header">
                <span className="avatar kn-dropdown-avatar">{initials}</span>
                <div>
                  <strong>{user?.name || 'Kitchen Staff'}</strong>
                  <div className="kn-role-badge">Kitchen Staff</div>
                </div>
              </div>

              <div className="kn-dropdown-divider" />

              {/* Actions */}
              <button className="kn-dropdown-item" onClick={handleRefresh}>
                <RefreshCw size={16} />
                Refresh Orders
              </button>
              <button className="kn-dropdown-item" onClick={() => { setDropdownOpen(false); if (onOpenProfile) onOpenProfile(); }}>
                <UserCircle size={16} />
                My Profile
              </button>
              <button className="kn-dropdown-item" onClick={() => { setDropdownOpen(false); if (onOpenPassword) onOpenPassword(); }}>
                <Settings size={16} />
                Change Password
              </button>

              <div className="kn-dropdown-divider" />

              <button className="kn-dropdown-item kn-dropdown-item--danger" onClick={handleLogout}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
