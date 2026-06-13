import { Coffee } from 'lucide-react';

export default function BrandMark({ compact = false, title = 'Velluto Cafe', subtitle = 'PREMIUM POS' }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}>
      <span className="brand-mark__icon"><Coffee size={22} strokeWidth={2.2} /></span>
      {!compact && <span><strong>{title}</strong><small>{subtitle}</small></span>}
    </div>
  );
}
