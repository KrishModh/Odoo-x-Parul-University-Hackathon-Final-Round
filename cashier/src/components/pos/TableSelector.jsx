export default function TableSelector({ tables, selectedTableId, onSelect, tableSessions = {} }) {
  return (
    <section className="table-selector">
      <div><span className="eyebrow">TABLE SESSION</span><h2>Select a table</h2></div>
      <div className="table-selector__list">
        {tables.map((table) => {
          const session = tableSessions[table.id];
          const itemCount = session?.cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;
          return (
            <button 
              key={table.id} 
              className={`pos-table-pill ${selectedTableId === table.id ? 'is-active' : ''}`} 
              onClick={() => onSelect(table)}
              style={{ position: 'relative' }}
            >
              <strong>{table.name}</strong>
              <small>{table.seats || 4} seats</small>
              {itemCount > 0 && (
                <span className="table-item-badge" style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#b05a50',
                  color: 'white',
                  borderRadius: '999px',
                  fontSize: '0.62rem',
                  fontWeight: '900',
                  padding: '2px 6px',
                  border: '2px solid white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                  {itemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
