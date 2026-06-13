import { Users } from 'lucide-react';

export default function TableCard({ table }) {
  const { name, status, seats, order, total } = table;

  return (
    <article
      className={`table-card table-card--${status}`}
      aria-label={`Table ${name} - ${status}`}
    >
      {/* Header */}
      <div className="table-card__header">
        <strong>{name}</strong>
        <span className="status-dot">{status}</span>
      </div>

      {/* Seats */}
      <p className="table-card__seats">
        <Users size={15} aria-hidden="true" /> {seats} seats
      </p>

      {/* Footer */}
      <footer className="table-card__footer">
        <span>{order || 'Ready for guests'}</span>
        {total && <strong>{total}</strong>}
      </footer>
    </article>
  );
}
