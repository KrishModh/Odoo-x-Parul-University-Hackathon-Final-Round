import { Users } from 'lucide-react';

export default function TableCard({ table }) {
  return (
    <article className={`table-card table-card--${table.status}`}>
      <div><strong>{table.name}</strong><span className="status-dot">{table.status}</span></div>
      <p><Users size={15} /> {table.seats} seats</p>
      <footer><span>{table.order || 'Ready for guests'}</span>{table.total && <strong>{table.total}</strong>}</footer>
    </article>
  );
}
