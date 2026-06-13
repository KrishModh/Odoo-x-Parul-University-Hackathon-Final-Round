import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/money';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <article className="cart-item">
      <div className="cart-item__main"><strong>{item.name}</strong><small>{formatCurrency(item.price)} each</small></div>
      <div className="quantity-stepper">
        <button onClick={() => onDecrease(item.id)}><Minus size={14} /></button>
        <span>{item.quantity}</span>
        <button onClick={() => onIncrease(item.id)}><Plus size={14} /></button>
      </div>
      <strong className="cart-item__total">{formatCurrency(item.price * item.quantity)}</strong>
      <button className="cart-remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button>
    </article>
  );
}
