import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/money';

const stockCopy = { in_stock: 'In stock', low_stock: 'Low stock', out_stock: 'Out' };

export default function ProductCard({ product, onAdd, disabled }) {
  return (
    <button className="product-card" onClick={() => onAdd(product)} disabled={disabled || product.stock_status === 'out_stock'}>
      <img src={product.image_url} alt={product.name} loading="lazy" />
      <span className={`stock-chip stock-chip--${product.stock_status}`}><i />{stockCopy[product.stock_status] || 'In stock'}</span>
      <div className="product-card__body"><div><strong>{product.name}</strong><small>{product.category_name}</small></div><span>{formatCurrency(product.price)}</span></div>
      <span className="product-card__add"><Plus size={18} />Add</span>
    </button>
  );
}
