import { Send } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import CartItem from './CartItem';

export default function CartSummary({ items, totals, selectedTable, onIncrease, onDecrease, onRemove, onSend, submitting }) {
  return (
    <section className="cart-panel">
      <div className="pos-section-heading"><div><span className="eyebrow">CURRENT ORDER</span><h2>{selectedTable ? selectedTable.name : 'Choose table'}</h2></div><span>{items.length} items</span></div>
      <div className="cart-actions-row"><button>Customer</button><button>Discount</button><button>Send</button></div>
      <div className="cart-list">
        {items.length ? items.map((item) => <CartItem key={item.id} item={item} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} />) : <div className="cart-empty"><strong>Your cart is empty</strong><span>Select a table and tap products to begin.</span></div>}
      </div>
      <div className="order-summary">
        <div><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
        <div><span>GST 5%</span><strong>{formatCurrency(totals.gst)}</strong></div>
        <div className="order-summary__total"><span>Total</span><strong>{formatCurrency(totals.total)}</strong></div>
      </div>
      <button className="send-kitchen-button" disabled={!selectedTable || !items.length || submitting} onClick={onSend}><Send size={18} />{submitting ? 'Saving order...' : 'Send to Kitchen'}</button>
    </section>
  );
}
