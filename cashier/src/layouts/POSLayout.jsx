import POSNavbar from '../components/pos/POSNavbar';

export default function POSLayout({ selectedTable, user, onLogout, stats, onOpenHistory, onOpenProfile, onOpenPassword, searchQuery, onSearchChange, children }) {
  return (
    <div className="pos-shell">
      <POSNavbar 
        selectedTable={selectedTable} 
        user={user} 
        onLogout={onLogout} 
        stats={stats} 
        onOpenHistory={onOpenHistory} 
        onOpenProfile={onOpenProfile} 
        onOpenPassword={onOpenPassword} 
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      {children}
    </div>
  );
}
