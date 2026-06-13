import POSNavbar from '../components/pos/POSNavbar';

export default function POSLayout({ selectedTable, user, children }) {
  return <div className="pos-shell"><POSNavbar selectedTable={selectedTable} user={user} />{children}</div>;
}
