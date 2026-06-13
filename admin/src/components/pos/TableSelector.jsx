export default function TableSelector({ tables, selectedTableId, onSelect }) {
  return (
    <section className="table-selector">
      <div><span className="eyebrow">TABLE SESSION</span><h2>Select a table</h2></div>
      <div className="table-selector__list">
        {tables.map((table) => (
          <button key={table.id} className={`pos-table-pill ${selectedTableId === table.id ? 'is-active' : ''}`} onClick={() => onSelect(table)}>
            <strong>{table.name}</strong><small>{table.seats || 4} seats</small>
          </button>
        ))}
      </div>
    </section>
  );
}
