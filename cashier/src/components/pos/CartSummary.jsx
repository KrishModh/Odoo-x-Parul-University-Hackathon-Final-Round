import { Send, Tag } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import CartItem from './CartItem';

export default function CartSummary({ 
  items, 
  totals, 
  selectedTable, 
  onIncrease, 
  onDecrease, 
  onRemove, 
  onSend, 
  submitting,
  appliedCoupon,
  onOpenCouponModal,
  onRemoveCoupon
}) {
  return (
    <section className="cart-panel">
      <div className="pos-section-heading"><div><span className="eyebrow">CURRENT ORDER</span><h2>{selectedTable ? selectedTable.name : 'Choose table'}</h2></div><span>{items.length} items</span></div>
      <div className="cart-list">
        {items.length ? items.map((item) => <CartItem key={item.id} item={item} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} />) : <div className="cart-empty"><strong>Your cart is empty</strong><span>Select a table and tap products to begin.</span></div>}
      </div>

      {items.length > 0 && (
        appliedCoupon ? (
          <div className="coupon-summary-row">
            <span className="applied-coupon-badge">
              <Tag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Coupon: {appliedCoupon.code}
            </span>
            <button onClick={onRemoveCoupon} className="remove-coupon-btn">Remove</button>
          </div>
        ) : (
          <button className="apply-coupon-btn" onClick={onOpenCouponModal}>
            <Tag size={14} /> Apply Coupon
          </button>
        )
      )}

      <div className="order-summary">
        <div><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
        
        {appliedCoupon && (
          <div>
            <span>Discount ({appliedCoupon.code})</span>
            <strong className="discount-text">-{formatCurrency(appliedCoupon.discount_amount)}</strong>
          </div>
        )}

        <div><span>GST 5%</span><strong>{formatCurrency(totals.gst)}</strong></div>
        
        <div className="order-summary__total">
          <span>Total</span>
          <strong>{formatCurrency(appliedCoupon ? totals.final_total : totals.total)}</strong>
        </div>
      </div>
      <button className="send-kitchen-button" disabled={!selectedTable || !items.length || submitting} onClick={onSend}><Send size={18} />{submitting ? 'Saving order...' : 'Send to Kitchen'}</button>
    </section>
  );
}
