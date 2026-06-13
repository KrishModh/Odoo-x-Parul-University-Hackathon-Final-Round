import { useState } from 'react';
import { WalletCards, Globe, User, Mail, Phone } from 'lucide-react';
import FormField from '../FormField';

export default function PaymentPanel({ onPay, disabled }) {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!customerName.trim()) {
      newErrors.name = 'Customer name is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim()) {
      newErrors.email = 'Customer email is required';
    } else if (!emailRegex.test(customerEmail)) {
      newErrors.email = 'Invalid email address';
    }

    if (!customerPhone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(customerPhone.trim())) {
      newErrors.phone = 'Invalid phone number (must be 10-15 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onPay(selectedMethod, {
        name: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim()
      });
    }
  };

  return (
    <div className="payment-panel">
      <form onSubmit={handleSubmit} className="pos-checkout-form">
        <div className="pos-section-heading" style={{ marginBottom: '10px' }}>
          <div>
            <span className="eyebrow">CUSTOMER</span>
            <h2>Details</h2>
          </div>
        </div>

        <FormField
          label="Customer Name"
          icon={User}
          placeholder="Enter customer name"
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: null });
          }}
          error={errors.name}
          disabled={disabled}
        />

        <FormField
          label="Customer Email"
          icon={Mail}
          type="email"
          placeholder="Enter customer email"
          value={customerEmail}
          onChange={(e) => {
            setCustomerEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: null });
          }}
          error={errors.email}
          disabled={disabled}
        />

        <FormField
          label="Customer Phone"
          icon={Phone}
          type="tel"
          placeholder="Enter phone number"
          value={customerPhone}
          onChange={(e) => {
            setCustomerPhone(e.target.value);
            if (errors.phone) setErrors({ ...errors, phone: null });
          }}
          error={errors.phone}
          disabled={disabled}
        />

        <div className="pos-section-heading" style={{ marginTop: '14px', marginBottom: '10px' }}>
          <div>
            <span className="eyebrow">CHECKOUT</span>
            <h2>Payment Method</h2>
          </div>
        </div>

        <div className="payment-methods" style={{ margin: '0 0 14px 0' }}>
          <button
            type="button"
            className={selectedMethod === 'cash' ? 'is-active' : ''}
            onClick={() => setSelectedMethod('cash')}
            disabled={disabled}
          >
            <WalletCards size={18} />
            Cash
          </button>
          <button
            type="button"
            className={selectedMethod === 'online' ? 'is-active' : ''}
            onClick={() => setSelectedMethod('online')}
            disabled={disabled}
          >
            <Globe size={18} />
            Online Payment
          </button>
        </div>

        <div className="payment-actions">
          <button
            type="submit"
            className="payment-actions__primary charge-payment-btn"
            disabled={disabled}
          >
            Charge Payment
          </button>
        </div>
      </form>
    </div>
  );
}
