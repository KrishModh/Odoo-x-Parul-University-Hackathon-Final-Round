import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import CategorySidebar from '../../components/pos/CategorySidebar';
import ProductCard from '../../components/pos/ProductCard';
import TableSelector from '../../components/pos/TableSelector';
import CartSummary from '../../components/pos/CartSummary';
import PaymentPanel from '../../components/pos/PaymentPanel';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/useAuth';
import POSLayout from '../../layouts/POSLayout';
import { createOrder, fetchPosBootstrap } from '../../services/posService';
import { calculateCartTotals } from '../../utils/money';
import '../../css/pos/pos.css';

export default function POSPage() {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totals = useMemo(() => calculateCartTotals(cart), [cart]);
  const filteredProducts = useMemo(() => activeCategory === 'all' ? products : products.filter((product) => product.category === activeCategory), [activeCategory, products]);

  const loadPos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPosBootstrap();
      setTables(data.tables);
      setCategories(data.categories);
      setProducts(data.products);
      setSelectedTable((current) => current || data.tables[0] || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load POS session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPos(); }, []);

  const addToCart = (product) => {
    if (!selectedTable) {
      setNotice('Select a table before adding items.');
      return;
    }
    setNotice('');
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...items, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const increase = (id) => setCart((items) => items.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decrease = (id) => setCart((items) => items.flatMap((item) => {
    if (item.id !== id) return [item];
    return item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [];
  }));
  const remove = (id) => setCart((items) => items.filter((item) => item.id !== id));

  const sendOrder = async () => {
    if (!selectedTable || !cart.length) return;
    setSubmitting(true);
    setNotice('');
    setError('');
    try {
      await createOrder({ table_id: selectedTable.id, items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })) });
      setCart([]);
      setNotice(`Order for ${selectedTable.name} saved to cart.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.assign('/login');
  };

  return (
    <POSLayout selectedTable={selectedTable} user={user} onLogout={handleLogout}>
      <main className="pos-main">
        <TableSelector tables={tables} selectedTableId={selectedTable?.id} onSelect={(table) => { setSelectedTable(table); setNotice(''); }} />
        {(notice || error) && <div className={`pos-alert ${error ? 'pos-alert--error' : ''}`}>{error || notice}<button onClick={error ? loadPos : () => setNotice('')}><RefreshCw size={15} />{error ? 'Retry' : 'Clear'}</button></div>}
        {loading ? <div className="pos-loader"><LoadingSpinner label="Opening POS session..." /></div> : (
          <section className="pos-workspace">
            <CategorySidebar categories={categories} activeCategory={activeCategory} onChange={setActiveCategory} />
            <section className="product-section">
              <div className="pos-section-heading"><div><span className="eyebrow">MENU</span><h2>{activeCategory === 'all' ? 'All products' : categories.find((category) => category.slug === activeCategory)?.name}</h2></div><span>{filteredProducts.length} products</span></div>
              <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} disabled={!selectedTable} />)}</div>
            </section>
            <CartSummary items={cart} totals={totals} selectedTable={selectedTable} onIncrease={increase} onDecrease={decrease} onRemove={remove} onSend={sendOrder} submitting={submitting} />
            <PaymentPanel total={totals.total} />
          </section>
        )}
      </main>
    </POSLayout>
  );
}
