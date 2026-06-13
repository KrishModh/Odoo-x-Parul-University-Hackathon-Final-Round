import { createElement } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function MetricCard({ label, value, detail, icon: Icon, tone = 'coffee' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top"><span className="metric-card__icon">{createElement(Icon, { size: 21 })}</span><ArrowUpRight size={18} /></div>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
