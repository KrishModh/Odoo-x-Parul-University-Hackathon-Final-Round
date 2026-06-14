import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/money';

const getStockDetails = (product) => {
  const qty = product.quantity !== undefined ? product.quantity : (product.currentStock !== undefined ? product.currentStock : 0);
  const statusRaw = (product.stock_status || product.stockStatus || '').toUpperCase();
  
  if (qty <= 0 || statusRaw === 'OUT_OF_STOCK') {
    return { label: 'Out Of Stock', classKey: 'out_of_stock', isOutOfStock: true };
  } else if (qty <= 5 || statusRaw === 'LOW_STOCK') {
    return { label: 'Low Stock', classKey: 'low_stock', isOutOfStock: false };
  } else {
    return { label: 'In Stock', classKey: 'in_stock', isOutOfStock: false };
  }
};

export default function ProductCard({ product, onAdd, disabled }) {
  const { label, classKey, isOutOfStock } = getStockDetails(product);
  
  return (
    <button 
      className="product-card" 
      onClick={() => onAdd(product)} 
      disabled={disabled || isOutOfStock}
      style={isOutOfStock ? {
        opacity: 0.55,
        cursor: 'not-allowed',
        pointerEvents: 'none',
        boxShadow: 'none'
      } : {}}
    >
      <img src={product.image_url} alt={product.name} loading="lazy" />
      <span className={`stock-chip stock-chip--${classKey}`}><i />{label}</span>
      <div className="product-card__body"><div><strong>{product.name}</strong><small>{product.category_name}</small></div><span>{formatCurrency(product.price)}</span></div>
      {isOutOfStock ? (
        <span className="product-card__add" style={{ background: '#eee7df', color: '#8a7b70' }}>Unavailable</span>
      ) : (
        <span className="product-card__add"><Plus size={18} />Add</span>
      )}
    </button>
  );
}
