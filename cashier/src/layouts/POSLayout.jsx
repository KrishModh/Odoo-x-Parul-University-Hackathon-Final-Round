import POSNavbar from '../components/pos/POSNavbar';

export default function POSLayout({ selectedTable, user, onLogout, children }) {
  return <div className="pos-shell"><POSNavbar selectedTable={selectedTable} user={user} onLogout={onLogout} />{children}</div>;
}
