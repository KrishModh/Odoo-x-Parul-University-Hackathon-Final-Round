import { CreditCard, WalletCards } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import Numpad from './Numpad';

export default function PaymentPanel({ total }) {
  return (
    <aside className="payment-panel">
      <div className="pos-section-heading"><div><span className="eyebrow">PAYMENT UI</span><h2>Amount preview</h2></div></div>
      <div className="amount-preview"><small>Total due</small><strong>{formatCurrency(total)}</strong><span>Payment is disabled for now</span></div>
      <div className="payment-methods"><button className="is-active"><WalletCards size={18} />Cash</button><button><CreditCard size={18} />Card</button></div>
      <Numpad />
      <div className="payment-actions"><button>Split</button><button>Hold</button><button className="payment-actions__primary">Charge UI</button></div>
    </aside>
  );
}
