import POSNavbar from '../components/pos/POSNavbar';

export default function POSLayout({ selectedTable, user, onLogout, stats, onOpenHistory, children }) {
  return <div className="pos-shell"><POSNavbar selectedTable={selectedTable} user={user} onLogout={onLogout} stats={stats} onOpenHistory={onOpenHistory} />{children}</div>;
}
