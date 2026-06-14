import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, User as UserIcon, Key } from 'lucide-react';

export default function ProfileMenu({ user, roleLabel, onLogout, onOpenProfile, onOpenPassword, triggerClassName = 'profile-button', compact = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const initials = user?.name?.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() || 'VC';

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar">{initials}</span>
        {!compact && (
          <span className="profile-button__copy">
            <strong>{user?.name || 'Cafe Staff'}</strong>
            <small>{roleLabel || user?.role || 'Cashier'}</small>
          </span>
        )}
        <ChevronDown size={16} className={`profile-menu__chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div className="profile-menu__dropdown" role="menu">
          <div className="profile-menu__summary">
            <strong>{user?.name || 'Cafe Staff'}</strong>
            <small>{user?.email || roleLabel || user?.role || 'Cashier'}</small>
          </div>
          <button
            type="button"
            className="profile-menu__item"
            onClick={() => {
              setOpen(false);
              if (onOpenProfile) onOpenProfile();
            }}
          >
            <UserIcon size={16} />
            My Profile
          </button>
          <button
            type="button"
            className="profile-menu__item"
            onClick={() => {
              setOpen(false);
              if (onOpenPassword) onOpenPassword();
            }}
          >
            <Key size={16} />
            Change Password
          </button>
          <button
            type="button"
            className="profile-menu__item"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
