const statusLabel = { preparing: 'Preparing', ready: 'Ready', served: 'Served' };

export default function OrderList({ orders }) {
  return (
    <div className="order-list">
      {orders.map((order) => (
        <div className="order-row" key={order.id}>
          <span className="order-row__id">{order.id}</span>
          <span><strong>{order.customer}</strong><small>{order.items} items · {order.time}</small></span>
          <span className={`order-status order-status--${order.status}`}>{statusLabel[order.status]}</span>
          <strong className="order-row__total">{order.total}</strong>
        </div>
      ))}
    </div>
  );
}
