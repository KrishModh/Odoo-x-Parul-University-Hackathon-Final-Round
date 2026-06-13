import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import '../../css/shared/dashboard.css'; // Reusing dashboard styles
import { UtensilsCrossed, Clock, CheckCircle } from 'lucide-react';

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState([]);
  
  // Dummy data for now
  useEffect(() => {
    setOrders([
      { id: '1001', status: 'pending', items: [{ name: 'Cappuccino', quantity: 2 }, { name: 'Croissant', quantity: 1 }], time: '10:30 AM' },
      { id: '1002', status: 'preparing', items: [{ name: 'Espresso', quantity: 1 }], time: '10:32 AM' },
      { id: '1003', status: 'completed', items: [{ name: 'Latte', quantity: 1 }, { name: 'Muffin', quantity: 2 }], time: '10:25 AM' },
    ]);
  }, []);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <MainLayout title="Kitchen Display System">
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '20px' }}>
        
        {/* Incoming Column */}
        <div className="dashboard-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UtensilsCrossed size={20} color="#e63946" />
            <h3 style={{ margin: 0 }}>Incoming</h3>
          </div>
          <div className="card-content">
            {pendingOrders.map(order => (
              <div key={order.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>#{order.id}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{order.time}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {order.items.map((item, idx) => (
                    <li key={idx}>{item.quantity}x {item.name}</li>
                  ))}
                </ul>
                <button className="primary-button" style={{ marginTop: '10px', width: '100%' }}>Start Preparing</button>
              </div>
            ))}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="dashboard-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#f4a261" />
            <h3 style={{ margin: 0 }}>Preparing</h3>
          </div>
          <div className="card-content">
            {preparingOrders.map(order => (
              <div key={order.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>#{order.id}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{order.time}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {order.items.map((item, idx) => (
                    <li key={idx}>{item.quantity}x {item.name}</li>
                  ))}
                </ul>
                <button className="primary-button" style={{ marginTop: '10px', width: '100%', backgroundColor: '#2a9d8f' }}>Mark Completed</button>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="dashboard-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} color="#2a9d8f" />
            <h3 style={{ margin: 0 }}>Completed</h3>
          </div>
          <div className="card-content">
            {completedOrders.map(order => (
              <div key={order.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', marginBottom: '10px', opacity: 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>#{order.id}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{order.time}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {order.items.map((item, idx) => (
                    <li key={idx}>{item.quantity}x {item.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
