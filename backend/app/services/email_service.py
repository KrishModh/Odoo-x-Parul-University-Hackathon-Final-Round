import resend
from flask import current_app


def send_email(to, subject, html):
    api_key = current_app.config['RESEND_API_KEY']
    if not api_key:
        raise RuntimeError('RESEND_API_KEY is not configured.')
    resend.api_key = api_key
    return resend.Emails.send({
        'from': current_app.config.get('EMAIL_FROM', 'Velluto Cafe <noreply@krishmodh.site>'),
        'to': [to],
        'subject': subject,
        'html': html,
    })


def send_otp_email(*, to, name, otp_code):
    subject = 'Verify your Velluto Cafe account'
    html = f"""
    <div style="font-family:Arial,sans-serif;background:#f7f3ee;padding:32px;color:#3b2b22;">
      <div style="max-width:560px;margin:0 auto;background:#fffdf9;border-radius:20px;padding:36px;border:1px solid #eadfd2;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;color:#a87857;font-weight:700;">VELLUTO CAFE</p>
        <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;">Verify your email</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#6e635c;">
          Hi {name}, use the verification code below to finish creating your account. The code expires in 5 minutes.
        </p>
        <div style="margin:0 0 24px;padding:18px 20px;border-radius:16px;background:#f3ebe3;border:1px solid #e4d5c6;text-align:center;">
          <span style="display:block;font-size:32px;letter-spacing:0.4em;font-weight:700;color:#49352a;">{otp_code}</span>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#8a7b70;">
          If you did not request this account, you can safely ignore this email.
        </p>
      </div>
    </div>
    """
    return send_email(to, subject, html)


def send_invoice_email(order):
    from ..extensions import db
    from datetime import datetime, timezone
    
    if not order.customer_email:
        return None
        
    items_html = ""
    for item in order.items:
        items_html += f"""
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee7df; font-size: 14px; color: #49352a; text-align: left;">
            <strong>{item.product_name}</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee7df; font-size: 14px; color: #49352a; text-align: center;">
            {item.quantity}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee7df; font-size: 14px; color: #49352a; text-align: right;">
            ₹{float(item.unit_price):.2f}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee7df; font-size: 14px; color: #49352a; text-align: right;">
            ₹{float(item.line_total):.2f}
          </td>
        </tr>
        """
        
    formatted_date = order.paid_at.strftime('%Y-%m-%d %H:%M:%S') if order.paid_at else order.created_at.strftime('%Y-%m-%d %H:%M:%S')
    table_name = order.table.name if order.table else 'Takeaway'
    
    subject = f"Invoice for your Velluto Cafe Order {order.order_number}"
    
    html = f"""
    <div style="font-family: 'DM Sans', Arial, sans-serif; background: #f7f5f0; padding: 40px 20px; color: #302b27; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background: #fffdf9; border: 1px solid #e7e1d8; border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(64, 47, 36, 0.04);">
        <!-- Logo / Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e7e1d8; padding-bottom: 20px;">
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #49352a; margin: 0 0 5px 0;">Velluto Cafe</h1>
          <p style="font-size: 11px; letter-spacing: 0.2em; color: #7f7972; text-transform: uppercase; margin: 0;">Premium Coffee & Bakery</p>
        </div>
        
        <!-- Welcome & Intro -->
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #49352a; margin: 0 0 10px 0;">Tax Invoice</h2>
          <p style="font-size: 14px; color: #7f7972; margin: 0;">Hi {order.customer_name or 'Valued Customer'},</p>
          <p style="font-size: 14px; color: #7f7972; margin: 5px 0 0 0;">Thank you for visiting Velluto Cafe! Here is the detailed receipt for your order.</p>
        </div>

        <!-- Order Metadata Grid -->
        <div style="background: #fdfaf7; border: 1px solid #e7e1d8; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #7f7972; width: 40%; text-align: left;"><strong>Order Number:</strong></td>
              <td style="padding: 4px 0; font-size: 13px; color: #49352a; text-align: left;">{order.order_number}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #7f7972; text-align: left;"><strong>Table:</strong></td>
              <td style="padding: 4px 0; font-size: 13px; color: #49352a; text-align: left;">{table_name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #7f7972; text-align: left;"><strong>Date & Time:</strong></td>
              <td style="padding: 4px 0; font-size: 13px; color: #49352a; text-align: left;">{formatted_date}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #7f7972; text-align: left;"><strong>Payment Method:</strong></td>
              <td style="padding: 4px 0; font-size: 13px; color: #49352a; text-transform: uppercase; text-align: left;">{order.payment_method or 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #7f7972; text-align: left;"><strong>Payment Status:</strong></td>
              <td style="padding: 4px 0; font-size: 13px; color: #547662; font-weight: bold; text-align: left;">{order.payment_status.upper()}</td>
            </tr>
          </table>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="border-bottom: 2px solid #e7e1d8;">
              <th style="padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: #7f7972; text-align: left;">Item</th>
              <th style="padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: #7f7972; text-align: center; width: 60px;">Qty</th>
              <th style="padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: #7f7972; text-align: right; width: 80px;">Price</th>
              <th style="padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: #7f7972; text-align: right; width: 90px;">Total</th>
            </tr>
          </thead>
          <tbody>
            {items_html}
          </tbody>
        </table>

        <!-- Totals Summary -->
        <table style="width: 250px; margin-left: auto; margin-bottom: 35px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #7f7972; text-align: left;">Subtotal:</td>
            <td style="padding: 6px 0; font-size: 14px; color: #49352a; text-align: right;">₹{float(order.subtotal):.2f}</td>
          </tr>
          {f'<tr><td style="padding: 6px 0; font-size: 14px; color: #7f7972; text-align: left;">Discount ({order.coupon_code}):</td><td style="padding: 6px 0; font-size: 14px; color: #c93b2b; text-align: right;">-₹{float(order.discount_amount):.2f}</td></tr>' if order.coupon_code else ''}
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #7f7972; border-bottom: 1px solid #e7e1d8; text-align: left;">GST (5%):</td>
            <td style="padding: 6px 0; font-size: 14px; color: #49352a; text-align: right; border-bottom: 1px solid #e7e1d8;">₹{float(order.gst):.2f}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; color: #49352a; text-align: left;">Total Amount:</td>
            <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; color: #49352a; text-align: right;">₹{float(order.final_total if order.coupon_code else order.total):.2f}</td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #e7e1d8; padding-top: 25px; text-align: center;">
          <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: #49352a; margin: 0 0 8px 0;">Thank you for visiting Velluto Cafe!</p>
          <p style="font-size: 13px; color: #7f7972; margin: 0 0 15px 0;">We hope to see you again soon.</p>
          <p style="font-size: 11px; color: #b2a496; margin: 0;">This is a system generated invoice. For any queries, write to us at support@velluto.com</p>
        </div>
      </div>
    </div>
    """
    
    try:
        response = send_email(order.customer_email, subject, html)
        order.invoice_sent = True
        order.invoice_sent_at = datetime.now(timezone.utc)
        db.session.commit()
        return response
    except Exception as e:
        print(f"Failed to send invoice email for order {order.order_number}: {e}")
        return None


def send_invoice_email_async(app, order_id):
    with app.app_context():
        from ..models import Order
        from ..extensions import db
        try:
            order = db.session.get(Order, order_id)
            if order:
                send_invoice_email(order)
        except Exception as e:
            print(f"Async email thread failed: {e}")


def start_invoice_email_thread(order):
    import threading
    app = current_app._get_current_object()
    thread = threading.Thread(
        target=send_invoice_email_async,
        args=(app, order.id)
    )
    thread.daemon = True
    thread.start()
