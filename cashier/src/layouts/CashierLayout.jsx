import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { useAuth } from '../context/useAuth';

export default function CashierLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar open={sidebarOpen} collapsed={collapsed} onClose={() => setSidebarOpen(false)} onCollapse={() => setCollapsed((value) => !value)} onLogout={handleLogout} />
      <div className="app-shell__content"><TopNavbar user={user} onMenuClick={() => setSidebarOpen(true)} /><main className="dashboard-main">{children}</main></div>
    </div>
  );
}
